#!/usr/bin/env node
 
(async () => {
  // Minimal .env.local parser to avoid adding runtime dependencies
  const fs = await import('fs');
  try {
    const envText = fs.readFileSync('./.env.local', 'utf8');
    envText.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    });
  } catch {
    // If .env.local is absent, continue with existing process.env
  }

const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.log('Missing required environment variables:', missing.join(', '));
} else {
  console.log('All required environment variables are present.');
}

// Check OAuth vars (optional but recommended)
const oauthRequired = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'];
const oauthMissing = oauthRequired.filter((k) => !process.env[k]);
if (oauthMissing.length) {
  console.log('OAuth variables missing (app will still run but OAuth providers will be disabled):', oauthMissing.join(', '));
} else {
  console.log('OAuth variables present.');
}

// Try to connect to the database
async function testDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;

  // Parse URL and attempt a connection for supported protocols (mysql / postgres)
  try {
    const { URL } = await import('url');
    const parsed = new URL(dbUrl);
    const proto = parsed.protocol.replace(/:$/, '');

    if (proto === 'mysql' || proto === 'mysql2') {
      const host = parsed.hostname;
      const port = parsed.port || 3306;
      const user = parsed.username;
      const password = parsed.password;
      const database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined;

      if (!host || !user || !database) {
        console.log('DATABASE_URL appears malformed. Expected mysql://user:pass@host:port/db');
        return;
      }

      const mysql = (await import('mysql2/promise')).default;
      console.log(`Attempting MySQL DB connection to ${user}@${host}:${port}/${database} (credentials hidden)`);
      const conn = await mysql.createConnection({ host, port, user, password, database, connectTimeout: 5000 });
      try {
        const [rows] = await conn.query('SELECT 1 as ok');
        console.log('DB connection successful:', rows && rows.length ? rows[0] : rows);
      } finally {
        await conn.end();
      }
    } else if (proto === 'postgres' || proto === 'postgresql') {
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: dbUrl, idleTimeoutMillis: 2000 });
      console.log('Attempting Postgres DB connection (credentials hidden)');
      try {
        const client = await pool.connect();
        try {
          const res = await client.query('SELECT 1 as ok');
          console.log('DB connection successful:', res && res.rows && res.rows[0] ? res.rows[0] : res.rows);
        } finally {
          client.release();
        }
      } finally {
        await pool.end();
      }
    } else {
      console.log('DATABASE_URL protocol is not recognized (supported: mysql, postgres). Skipping DB connectivity test.');
    }
  } catch (err) {
    console.log('DB connection failed:', err && err.message ? err.message : err);
  }
};

await testDb().catch((e) => {
  console.error('Unexpected error running DB test:', e);
  process.exitCode = 2;
});
})();

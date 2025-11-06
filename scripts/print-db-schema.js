const { Client } = require('pg');
const url = process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL || '';
if (!url) {
  console.error('DATABASE_URL not set.');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: url });
  await client.connect();

  const tables = ['users', 'customers', 'invoices', 'revenue'];

  for (const t of tables) {
    try {
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [t]);
      if (res.rows.length === 0) {
        console.log(`\nTable '${t}' not found.`);
        continue;
      }
      console.log(`\nTable: ${t}`);
      console.table(res.rows);
    } catch (err) {
      console.log(`\nError fetching table ${t}:`, err.message);
    }
  }

  await client.end();
})();

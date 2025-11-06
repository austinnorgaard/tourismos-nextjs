// Lightweight .env.local loader (so this script works the same as check-env-and-db)
const fs = require('fs');
try {
  const envText = fs.readFileSync('./.env.local', 'utf8');
  envText.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  });
} catch (e) {
  // ignore if .env.local not present
}

const required = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
  // Apple keys are optional unless you plan to enable Apple sign in
];

const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.log('Missing OAuth environment variables:', missing.join(', '));
  process.exitCode = 2;
} else {
  console.log('All required OAuth env vars appear present');
}

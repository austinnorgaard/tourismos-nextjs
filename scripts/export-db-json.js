const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const url = process.env.DATABASE_URL || '';
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
(async ()=>{
  const client = new Client({ connectionString: url });
  await client.connect();
  const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
  const tables = res.rows.map(r=>r.table_name);
  const outDir = path.resolve(__dirname, '..', 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  for (const t of tables) {
    try {
      const rows = await client.query(`SELECT * FROM "${t}"`);
      const file = path.join(outDir, `${t}.json`);
      fs.writeFileSync(file, JSON.stringify(rows.rows, null, 2));
      console.log(`Wrote ${file} (${rows.rows.length} rows)`);
    } catch (e) {
      console.log(`Skipping ${t}: ${e.message}`);
    }
  }
  await client.end();
})();

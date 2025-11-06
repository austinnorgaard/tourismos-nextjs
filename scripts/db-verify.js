const { Client } = require('pg');
const url = process.env.DATABASE_URL || '';
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
(async ()=>{
  const client = new Client({ connectionString: url });
  await client.connect();
  const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
  console.log('Tables:');
  console.table(res.rows);
  for (const r of res.rows) {
    const t = r.table_name;
    try {
      const c = await client.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
      console.log(`${t}: ${c.rows[0].cnt} rows`);
    } catch (e) {
      console.log(`${t}: cannot count (${e.message})`);
    }
  }
  await client.end();
})();

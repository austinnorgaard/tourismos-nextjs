const url = process.env.DATABASE_URL || '';
const isPostgres = url.startsWith('postgres:') || url.startsWith('postgresql:');

const config = {
  schema: isPostgres ? './drizzle/schema.pg.ts' : './drizzle/schema.ts',
  dialect: isPostgres ? 'postgresql' : 'mysql',
  url: process.env.DATABASE_URL,
  out: './drizzle/migrations',
};

export default config;

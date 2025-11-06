// Minimal drizzle config shim for TypeScript builds.
// The real runtime config is in drizzle.config.mjs. Keep this file to avoid
// accidental type errors from the ESM config during `tsc` runs.
const url = process.env.DATABASE_URL || '';
const isPostgres = url.startsWith('postgres:') || url.startsWith('postgresql:');

const _config: any = {
  schema: isPostgres ? './drizzle/schema.pg.ts' : './drizzle/schema.ts',
  // Provide both dialect and url for CLI compatibility (drizzle-kit expects 'dialect')
  dialect: isPostgres ? 'postgresql' : 'mysql',
  url: process.env.DATABASE_URL,
  out: './drizzle/migrations',
};

export default _config;

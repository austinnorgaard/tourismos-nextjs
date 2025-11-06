Neon (Postgres) Migration Guide
================================

This guide walks through migrating the app from MySQL to Neon (Postgres-compatible).

1) Provision a Neon database
   - Create a Neon project and copy the connection string (DATABASE_URL). It will look like:
     postgres://<user>:<password>@<host>:5432/<database>?sslmode=require

2) Update `.env.local`
   - Replace `DATABASE_URL` with the Neon connection string.

3) Update dependencies
   - Ensure `pg` (node-postgres) is installed so `drizzle-orm` can use Postgres.

4) Migrate schema
   - If you used Drizzle migrations previously for MySQL, you may need to adjust migrations for Postgres types.
   - Run migrations with drizzle-kit (adjust the driver if necessary):

     ```bash
     # ensure DATABASE_URL is set
     pnpm -C . run db:push
     ```

   - Alternatively, export schema as SQL and apply to Neon via psql.

5) Verify connection
   - Run the env+db checker:
     ```powershell
     pnpm run check:env-and-db
     ```

6) Update any raw SQL queries that are MySQL-specific (e.g., backtick quoting, AUTO_INCREMENT) to Postgres equivalents.

7) Deploy
   - Update the hosting environment variables in your deployment (Vercel, Netlify, etc.) to the new `DATABASE_URL`.

Notes
-----
- Drizzle supports multiple dialects. Ensure your drizzle config (if present) is set for Postgres.
- Neon requires SSL; include `?sslmode=require` or configure NODE_TLS_REJECT_UNAUTHORIZED appropriately in your environment.

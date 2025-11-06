Deployment notes

Required environment variables (minimum):
- DATABASE_URL (Neon Postgres connection string)
- SESSION_SECRET
- OAUTH (passport) variables:
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - MICROSOFT_CLIENT_ID
  - MICROSOFT_CLIENT_SECRET
- NEXT_PUBLIC_VERCEL_PROJECT (optional: for public site deployment flow)

Notes on migrations and backups:
- Drizzle migrations have been generated in `drizzle/migrations/`. Review the SQL files before applying to production.
- A JSON export backup was created before applying the migrations. Look under `exports/` (if present) for backup json files.

How to re-enable Apple OAuth:
1. Re-enable the Apple strategy in `server/auth.ts` (or wherever the Passport config for Apple was commented out).
2. Add `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and the `APPLE_PRIVATE_KEY` (or path) to environment variables.
3. Re-test the OAuth flow and ensure the callback routes are reachable.

Smoke tests performed:
- `node ./scripts/check-env-and-db.js` reported DB connection OK (Neon) but missing OAuth client credentials.
- Production build (`pnpm run build`) completed successfully and server returned HTTP 200 on GET /.

Next steps recommended before merging:
- Provide valid OAuth credentials in the target deployment environment.
- Run full e2e tests for OAuth (Google/Microsoft) in a staging environment.
- Review Drizzle migration SQL for destructive changes and add explicit backups if applying to production.

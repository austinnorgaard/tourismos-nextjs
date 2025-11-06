OAuth Setup
===========

This document lists the environment variables and callback URLs required to enable third-party OAuth providers (Google, Microsoft, Apple) for local development and production.

Required environment variables
------------------------------
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL (optional; defaults to http://localhost:3000/api/auth/google/callback)

- MICROSOFT_CLIENT_ID
- MICROSOFT_CLIENT_SECRET
- MICROSOFT_CALLBACK_URL (optional; defaults to http://localhost:3000/api/auth/microsoft/callback)

- APPLE_CLIENT_ID
- APPLE_TEAM_ID
- APPLE_KEY_ID
- APPLE_PRIVATE_KEY
- APPLE_CALLBACK_URL (optional; defaults to http://localhost:3000/api/auth/apple/callback)

Local callback URLs
-------------------
When running locally (Next dev on http://localhost:3000), use the following callback URLs in provider consoles:

- Google:  http://localhost:3000/api/auth/google/callback
- Microsoft: http://localhost:3000/api/auth/microsoft/callback
- Apple:   http://localhost:3000/api/auth/apple/callback

Notes
-----
- The application exposes an adapter at `pages/api/auth/[...slug].ts` that forwards `/api/auth/*` requests to the server-side Express router in `server/oauth.ts`.
- The OAuth callbacks create a session token using the internal `sdk.createSessionToken(openId)` call and set a cookie named from `COOKIE_NAME` using `getSessionCookieOptions(req)`.
- For local testing ensure you have valid provider credentials and that your provider app's redirect URLs match the callback URLs above.

Quick local test steps
----------------------
1. Ensure env vars are set (see the check script in package.json):

   ```powershell
   pnpm run check:oauth-env
   ```

2. Start development server:

   ```powershell
   pnpm dev
   ```

3. Visit the Auth page at `http://localhost:3000/auth` and click the Google or Microsoft sign-in button.

4. Complete consent in the provider's flow. On success you should be redirected to `/` and see the session applied.

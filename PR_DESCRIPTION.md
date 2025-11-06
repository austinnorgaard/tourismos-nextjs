Summary of changes

- Ported database usage to Postgres (Neon) and applied Drizzle migrations.
- Replaced static drizzle Postgres driver import with a runtime loader in `server/db.ts`.
- Disabled Apple OAuth across server and client code.
- Converted problematic server-side imports (e.g., `streamdown`) to client-only dynamic imports.
- Made many pages/components SSR-safe: guarded `window`, `location`, `localStorage`, `Notification` usages and moved browser-only logic into effects or client components.
- Added `pages/_app.tsx` to wrap legacy pages with providers (tRPC, QueryClient, ThemeProvider).
- Added `eslint.config.cjs` (flat config) and fixed lint issues across components.
- Minor UI/UX fixes to ensure deterministic rendering and remove impure calls during render.

Files changed (high level)
- server/db.ts (runtime driver loader)
- drizzle/* (schema + migrations)
- many files under `app/` and `pages/` to fix SSR issues (notably analytics, settings, chatbot-related components)
- components/*: DashboardLayout, ManusDialog, Sidebar, ThemeContext, etc.
- eslint.config.cjs (new)

Notes
- The production build completes locally and the server starts and serves routes. The server connects to Neon successfully in our environment check.
- ESLint was updated to run with a minimal flat config to support ESLint v9 and `eslint-config-next`.

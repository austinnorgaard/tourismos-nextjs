export { COOKIE_NAME, ONE_YEAR_MS } from "@/shared/const";

export const APP_TITLE = process.env.NEXT_PUBLIC_VITE_APP_TITLE || "App";

export const APP_LOGO =
  process.env.NEXT_PUBLIC_VITE_APP_LOGO ||
  "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = process.env.NEXT_PUBLIC_VITE_OAUTH_PORTAL_URL || '';
  const appId = process.env.NEXT_PUBLIC_VITE_APP_ID;

  // Only construct redirectUri and state in the browser
  if (typeof window === 'undefined') {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    if (typeof appId === "string") url.searchParams.set("appId", appId);
    url.searchParams.set("type", "signIn");
    return url.toString();
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  if (typeof appId === "string") {
    url.searchParams.set("appId", appId);
  }
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
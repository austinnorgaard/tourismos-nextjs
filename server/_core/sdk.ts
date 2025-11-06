// Minimal placeholder export for SDK used by server oauth and other modules.
// The real SDK lives in the original project; this placeholder prevents TS errors
// during static checks. Replace with the real implementation as needed.

export const sdk = {
  // placeholder methods
  getUser: async () => null,

  // Create a simple session token placeholder. Real implementation should
  // create a cryptographically signed token and persist any session state if
  // required. This returns a stable-ish string sufficient for static checks
  // and local development.
  createSessionToken: async (openId: string, opts?: { name?: string; expiresInMs?: number }) => {
    const namePart = opts?.name ? `:${opts.name}` : "";
    const expires = opts?.expiresInMs ? `:${opts.expiresInMs}` : `:${Date.now()}`;
    return `${openId}${namePart}${expires}`;
  },
};

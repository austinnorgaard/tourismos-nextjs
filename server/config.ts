/**
 * Centralized env resolver for server-only config values.
 * Keeps production vs dev fallbacks in one place and documents required env names.
 */
// Ensure .env.local is loaded in development for scripts
import './env';

export function getOAuthConfig() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const googleCallback = process.env.GOOGLE_CALLBACK_URL || process.env.NEXT_PUBLIC_GOOGLE_CALLBACK_URL || `http://localhost:3000/api/auth/google/callback`;

  const microsoftClientId = process.env.MICROSOFT_CLIENT_ID || '';
  const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
  const microsoftCallback = process.env.MICROSOFT_CALLBACK_URL || process.env.NEXT_PUBLIC_MICROSOFT_CALLBACK_URL || `http://localhost:3000/api/auth/microsoft/callback`;

  const appleClientId = process.env.APPLE_CLIENT_ID || '';
  const appleTeamId = process.env.APPLE_TEAM_ID || '';
  const appleKeyId = process.env.APPLE_KEY_ID || '';
  const applePrivateKey = process.env.APPLE_PRIVATE_KEY || '';
  const appleCallback = process.env.APPLE_CALLBACK_URL || process.env.NEXT_PUBLIC_APPLE_CALLBACK_URL || `http://localhost:3000/api/auth/apple/callback`;

  return {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      callbackUrl: googleCallback,
    },
    microsoft: {
      clientId: microsoftClientId,
      clientSecret: microsoftClientSecret,
      callbackUrl: microsoftCallback,
    },
    apple: {
      clientId: appleClientId,
      teamId: appleTeamId,
      keyId: appleKeyId,
      privateKey: applePrivateKey,
      callbackUrl: appleCallback,
    },
  };
}

export function requireOAuthEnv() {
  const cfg = getOAuthConfig();
  const missing: string[] = [];
  if (!cfg.google.clientId || !cfg.google.clientSecret) {
    missing.push('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
  }
  if (!cfg.microsoft.clientId || !cfg.microsoft.clientSecret) {
    missing.push('MICROSOFT_CLIENT_ID/MICROSOFT_CLIENT_SECRET');
  }
  return { cfg, missing };
}

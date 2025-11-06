console.log("[OAuth] ===== OAUTH.TS FILE IS BEING LOADED =====");
import { Router } from "express";
import type { Request, Response, NextFunction, Express } from 'express';
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
// Apple OAuth disabled per user request. Keep import commented for future re-enable.
// import { Strategy as AppleStrategy } from "passport-apple";
import { getDb } from "@/server/db";
import { users, oauthAccounts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getSessionCookieOptions } from "@/server/_core/cookies";
import { COOKIE_NAME } from "@/shared/const";
import { sdk } from "@/server/_core/sdk";

const router = Router();

console.log("[OAuth] Third-party OAuth router module loaded");
import { getOAuthConfig, requireOAuthEnv } from './config';

const { cfg: oauthCfg, missing: oauthMissing } = requireOAuthEnv();

const GOOGLE_CALLBACK_URL = oauthCfg.google.callbackUrl;
const MICROSOFT_CALLBACK_URL = oauthCfg.microsoft.callbackUrl;
const APPLE_CALLBACK_URL = oauthCfg.apple.callbackUrl;

if (oauthMissing.length) {
  console.warn('[OAuth] Missing OAuth credentials:', oauthMissing.join(', '));
}

// Configure Google OAuth Strategy
console.log("[OAuth] Configuring Google strategy...");
if (oauthCfg.google.clientId && oauthCfg.google.clientSecret) {
  console.log("[OAuth] Google credentials found, initializing strategy");
  const __googleVerify: any = async (accessToken: string, refreshToken: string, profile: any, done: (err?: unknown, user?: unknown) => void) => {
    try {
      const db = await getDb();
      if (!db) {
        return done(new Error("Database unavailable"));
      }

      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("No email found in Google profile"));
      }

      // Check if OAuth account already linked
      const [existingOAuth] = await db.select().from(oauthAccounts)
        .where(and(
          eq(oauthAccounts.provider, "google"),
          eq(oauthAccounts.providerAccountId, profile.id)
        )).limit(1);

      let user;
      if (existingOAuth) {
        // OAuth account exists, get the user
        [user] = await db.select().from(users).where(eq(users.id, existingOAuth.userId)).limit(1);
        // Update last signed in
        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      } else {
        // Check if user exists by email
        [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user) {
          // Create new user
          const openId = `google_${profile.id}`;
          const result = await db.insert(users).values({
            openId,
            name: profile.displayName,
            email,
            loginMethod: "google",
            role: "user",
            lastSignedIn: new Date(),
          });
          const userId = result[0].insertId;
          [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        } else {
          // User exists, update last signed in
          await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
        }

        // Link OAuth account to user
        await db.insert(oauthAccounts).values({
          userId: user.id,
          provider: "google",
          providerAccountId: profile.id,
          providerEmail: email,
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  };

  passport.use(new GoogleStrategy(
    {
      clientID: oauthCfg.google.clientId,
      clientSecret: oauthCfg.google.clientSecret,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    __googleVerify as any
  ) as any);
} else {
  console.log("[OAuth] Google credentials NOT found");
}

// Configure Microsoft OAuth Strategy
console.log("[OAuth] Configuring Microsoft strategy...");
if (oauthCfg.microsoft.clientId && oauthCfg.microsoft.clientSecret) {
  console.log("[OAuth] Microsoft credentials found, initializing strategy");
  const __msVerify: any = async (accessToken: string, refreshToken: string, profile: any, done: (err?: unknown, user?: unknown) => void) => {
    try {
      const db = await getDb();
      if (!db) {
        return done(new Error("Database unavailable"));
      }

      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("No email found in Microsoft profile"));
      }

      // Check if OAuth account already linked
      const [existingOAuth] = await db.select().from(oauthAccounts)
        .where(and(
          eq(oauthAccounts.provider, "microsoft"),
          eq(oauthAccounts.providerAccountId, profile.id)
        )).limit(1);

      let user;
      if (existingOAuth) {
        // OAuth account exists, get the user
        [user] = await db.select().from(users).where(eq(users.id, existingOAuth.userId)).limit(1);
        // Update last signed in
        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      } else {
        // Check if user exists by email
        [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user) {
          // Create new user
          const openId = `microsoft_${profile.id}`;
          const result = await db.insert(users).values({
            openId,
            name: profile.displayName,
            email,
            loginMethod: "microsoft",
            role: "user",
            lastSignedIn: new Date(),
          });
          const userId = result[0].insertId;
          [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        } else {
          // User exists, update last signed in
          await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
        }

        // Link OAuth account to user
        await db.insert(oauthAccounts).values({
          userId: user.id,
          provider: "microsoft",
          providerAccountId: profile.id,
          providerEmail: email,
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  };

  passport.use(new MicrosoftStrategy(
    {
      clientID: oauthCfg.microsoft.clientId,
      clientSecret: oauthCfg.microsoft.clientSecret,
      callbackURL: MICROSOFT_CALLBACK_URL,
      scope: ["user.read"],
    },
    __msVerify as any
  ) as any);
}

// Apple OAuth is currently disabled. To re-enable, ensure APPLE_CLIENT_ID, APPLE_TEAM_ID,
// APPLE_KEY_ID, and APPLE_PRIVATE_KEY are provided, then uncomment the AppleStrategy
// import above and the code below.
/*
// Configure Apple OAuth Strategy
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
  // ... original Apple strategy code ...
}
*/

// Test route to verify router is working
router.get("/test", (req, res) => {
  console.log("[OAuth] Test route hit!");
  res.json({ message: "OAuth router is working", timestamp: new Date().toISOString() });
});

// Initialize passport
router.use(passport.initialize());
console.log("[OAuth] Passport initialized");

// Google OAuth routes
router.get("/google", (req, res, next) => {
  console.log("[OAuth] Google route hit");
  console.log("[OAuth] Google Client ID configured:", !!process.env.GOOGLE_CLIENT_ID);
  try {
    passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
  } catch (error) {
    console.error("[OAuth] Error in Google authenticate:", error);
    next(error);
  }
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/auth?error=google" }),
  async (req, res) => {
    try {
      const user = (req.user as unknown) as { openId?: string; name?: string } | undefined;

      if (!user || !user.openId) {
        console.error("[OAuth] Google callback: No user or openId found");
        return res.redirect("/auth?error=google");
      }

      // Create session token using openId
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      // Redirect to home
      res.redirect("/");
    } catch (error) {
      console.error("[OAuth] Google callback error:", error);
      res.redirect("/auth?error=google");
    }
  }
);

// Microsoft OAuth routes
router.get("/microsoft", (req, res, next) => {
  console.log("[OAuth] Microsoft route hit");
  console.log("[OAuth] Microsoft Client ID configured:", !!process.env.MICROSOFT_CLIENT_ID);
  passport.authenticate("microsoft", { scope: ["user.read"], session: false })(req, res, next);
});

router.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", { session: false, failureRedirect: "/auth?error=microsoft" }),
  async (req, res) => {
    try {
      const user = (req.user as unknown) as { openId?: string; name?: string } | undefined;

      if (!user || !user.openId) {
        console.error("[OAuth] Microsoft callback: No user or openId found");
        return res.redirect("/auth?error=microsoft");
      }

      // Create session token using openId
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      // Redirect to home
      res.redirect("/");
    } catch (error) {
      console.error("[OAuth] Microsoft callback error:", error);
      res.redirect("/auth?error=microsoft");
    }
  }
);

// Apple OAuth routes are intentionally disabled. To re-enable, restore the
// passport 'apple' routes above and ensure the Apple strategy is configured.

// Error handler for OAuth routes
router.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error("[OAuth] Error:", err);
  // reference _next to satisfy no-unused-params rules
  void _next;
  const message = (err && typeof (err as { message?: unknown })?.message === 'string') ? (err as { message?: string }).message : 'Unknown error';
  res.status(500).send("Internal Server Error: " + message);
});

// Export setup function to register routes directly on app
export function setupOAuthRoutes(app: Express) {
  console.log("[OAuth] Setting up OAuth routes on /api/auth/*");
  
  // Initialize passport
  app.use(passport.initialize());
  
  // Test route
  app.get("/api/auth/oauth-test", (req: Request, res: Response) => {
    res.json({ message: "OAuth routes are working", timestamp: new Date().toISOString() });
  });
  
  // Google OAuth routes
  app.get("/api/auth/google", (req: Request, res: Response, next: NextFunction) => {
    console.log("[OAuth] Google route hit");
    passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
  });
  
  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { session: false, failureRedirect: "/auth?error=google" }),
    async (req: Request, res: Response) => {
      try {
        const user = (req.user as unknown) as { openId?: string } | undefined;
        if (!user || !user.openId) {
          console.error('[OAuth] Google callback (setup) - no user or openId');
          return res.redirect('/auth?error=google');
        }

        const token = await sdk.createSessionToken(user.openId);
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, token, cookieOptions);
        res.redirect("/");
      } catch (error) {
        console.error("[OAuth] Google callback error:", error);
        res.redirect("/auth?error=google");
      }
    }
  );
  
  // Microsoft OAuth routes  
  app.get("/api/auth/microsoft", (req: Request, res: Response, next: NextFunction) => {
    console.log("[OAuth] Microsoft route hit");
    passport.authenticate("microsoft", { scope: ["user.read"], session: false })(req, res, next);
  });
  
  app.get("/api/auth/microsoft/callback",
    passport.authenticate("microsoft", { session: false, failureRedirect: "/auth?error=microsoft" }),
    async (req: Request, res: Response) => {
      try {
        const user = (req.user as unknown) as { openId?: string } | undefined;
        if (!user || !user.openId) {
          console.error('[OAuth] Microsoft callback (setup) - no user or openId');
          return res.redirect('/auth?error=microsoft');
        }

        const token = await sdk.createSessionToken(user.openId);
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, token, cookieOptions);
        res.redirect("/");
      } catch (error) {
        console.error("[OAuth] Microsoft callback error:", error);
        res.redirect("/auth?error=microsoft");
      }
    }
  );
  
  console.log("[OAuth] OAuth routes registered successfully");
}

export default router;

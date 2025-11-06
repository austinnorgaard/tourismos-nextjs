"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 
import { APP_LOGO, APP_TITLE } from "@/const";
import { Mountain } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Check for OAuth errors in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error) {
        toast.error(`${error.charAt(0).toUpperCase() + error.slice(1)} login failed. Please try again.`);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";

    type AuthBody = {
      email: string | null;
      password: string | null;
      name?: string | null;
      username?: string | null;
    };

    const body: AuthBody = {
      email: formData.get("email") as string | null,
      password: formData.get("password") as string | null,
    };

    if (!isLogin) {
      body.name = formData.get("name") as string | null;
      body.username = formData.get("username") as string | null;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isLogin ? "Logged in successfully!" : "Account created successfully!");
        // Reload to update auth state
        window.location.href = "/";
      } else {
        toast.error(data.error || "Authentication failed");
      }
    } catch (error) {
      console.log(error)
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Mountain className="h-12 w-12 text-primary" />
              <span className="text-3xl font-bold text-foreground">TourismOS</span>
            </div>
          </div>
          <CardTitle className="text-2xl">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your TourismOS account" : "Start managing your tourism business"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Username (optional)</label>
                <input
                  type="text"
                  name="username"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="johndoe"
                  minLength={3}
                />
                <p className="text-xs text-muted-foreground mt-1">You can use this to login instead of email</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{isLogin ? "Email or Username" : "Email"}</label>
              <input
                type={isLogin ? "text" : "email"}
                name="email"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isLogin ? "you@example.com or username" : "you@example.com"}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Password</label>
                {isLogin && (
                  <Link href="/forgot-password">
                    <span className="text-xs text-primary hover:underline cursor-pointer">Forgot password?</span>
                  </Link>
                )}
              </div>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* OAuth buttons disabled due to gateway routing issues
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (typeof window !== 'undefined') window.location.href = "/api/auth/google"; }}
              className="w-full"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (typeof window !== 'undefined') window.location.href = "/api/auth/microsoft"; }}
              className="w-full"
            >
              <svg className="h-5 w-5" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
            </Button>
          </div>
          */}

          <div className="mt-6 text-center space-y-2">
            {isLogin && (
              <div>
                <Link href="/forgot-username">
                  <span className="text-xs text-muted-foreground hover:text-primary hover:underline cursor-pointer">
                    Forgot username?
                  </span>
                </Link>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

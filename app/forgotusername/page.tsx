'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function ForgotUsername() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
        toast.success(data.message || "Username sent to your email!");
      } else {
        toast.error(data.error || "Failed to send username");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {APP_LOGO && (
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold text-slate-900">{APP_TITLE}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Username</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you your username
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    If an account exists with that email and has a username, we've sent it to you.
                    Please check your inbox and spam folder.
                  </p>
                </div>
                <Link href="/auth">
                  <Button variant="outline" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Username"}
                </Button>

                <div className="text-center">
                  <Link href="/auth">
                    <Button variant="link" className="text-sm">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

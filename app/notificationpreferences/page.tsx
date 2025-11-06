'use client';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Webhook } from "lucide-react";
import { toast } from "sonner";

export default function NotificationPreferences() {
  // In a real implementation, these would be fetched from the backend
  const [preferences, setPreferences] = useState({
    email: {
      bookings: true,
      payments: true,
      marketing: false,
      system: true,
    },
    push: {
      bookings: true,
      payments: true,
      marketing: false,
      system: false,
    },
  });

  const [pushSupported] = useState(() => {
    return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  });

  const [pushPermission, setPushPermission] = useState(() => {
    if (!pushSupported) return "unsupported";
    return Notification.permission;
  });

  const handleToggle = (category: "email" | "push", type: keyof typeof preferences.email) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type],
      },
    }));
  };

  const handleSave = () => {
    // In a real implementation, save to backend
    toast.success("Notification preferences saved");
  };

  const handleEnablePush = async () => {
    if (!pushSupported) {
      toast.error("Push notifications are not supported in your browser");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        toast.success("Push notifications enabled");
        // In a real implementation, register service worker and subscribe to push
      } else {
        toast.error("Push notification permission denied");
      }
    } catch (error) {
      console.error("Error requesting push permission:", error);
      toast.error("Failed to enable push notifications");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Manage how you receive notifications from TourismOS
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <CardDescription>Receive notifications via email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-bookings" className="flex flex-col gap-1">
                <span>Bookings</span>
                <span className="text-sm font-normal text-muted-foreground">
                  New bookings and booking updates
                </span>
              </Label>
              <Switch
                id="email-bookings"
                checked={preferences.email.bookings}
                onCheckedChange={() => handleToggle("email", "bookings")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-payments" className="flex flex-col gap-1">
                <span>Payments</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Payment confirmations and refunds
                </span>
              </Label>
              <Switch
                id="email-payments"
                checked={preferences.email.payments}
                onCheckedChange={() => handleToggle("email", "payments")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-marketing" className="flex flex-col gap-1">
                <span>Marketing</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Tips, updates, and promotional content
                </span>
              </Label>
              <Switch
                id="email-marketing"
                checked={preferences.email.marketing}
                onCheckedChange={() => handleToggle("email", "marketing")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-system" className="flex flex-col gap-1">
                <span>System</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Account and security notifications
                </span>
              </Label>
              <Switch
                id="email-system"
                checked={preferences.email.system}
                onCheckedChange={() => handleToggle("email", "system")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Push Notifications</CardTitle>
            </div>
            <CardDescription>Receive notifications in your browser</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!pushSupported ? (
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                Push notifications are not supported in your browser. Please use a modern browser
                like Chrome, Firefox, or Edge.
              </div>
            ) : pushPermission !== "granted" ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium mb-2">Enable push notifications</p>
                  <p className="text-muted-foreground mb-4">
                    Get instant notifications about bookings, payments, and important updates even
                    when you're not on the site.
                  </p>
                  <Button onClick={handleEnablePush} size="sm">
                    Enable Push Notifications
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-bookings" className="flex flex-col gap-1">
                    <span>Bookings</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      New bookings and booking updates
                    </span>
                  </Label>
                  <Switch
                    id="push-bookings"
                    checked={preferences.push.bookings}
                    onCheckedChange={() => handleToggle("push", "bookings")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-payments" className="flex flex-col gap-1">
                    <span>Payments</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Payment confirmations and refunds
                    </span>
                  </Label>
                  <Switch
                    id="push-payments"
                    checked={preferences.push.payments}
                    onCheckedChange={() => handleToggle("push", "payments")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-marketing" className="flex flex-col gap-1">
                    <span>Marketing</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Tips, updates, and promotional content
                    </span>
                  </Label>
                  <Switch
                    id="push-marketing"
                    checked={preferences.push.marketing}
                    onCheckedChange={() => handleToggle("push", "marketing")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-system" className="flex flex-col gap-1">
                    <span>System</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Account and security notifications
                    </span>
                  </Label>
                  <Switch
                    id="push-system"
                    checked={preferences.push.system}
                    onCheckedChange={() => handleToggle("push", "system")}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Webhook Notifications */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <CardTitle>Webhook Integrations</CardTitle>
            </div>
            <CardDescription>
              Send notifications to external services via webhooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Coming Soon</p>
              <p>
                Configure webhooks to send booking and payment notifications to your own systems,
                Slack, Discord, or other services.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

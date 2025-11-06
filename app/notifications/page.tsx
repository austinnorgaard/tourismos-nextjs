'use client';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
 
import { Bell, Mail, MessageSquare, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Notifications() {
  const [preferences, setPreferences] = useState({
    // Email Notifications
    emailNewBooking: true,
    emailBookingCanceled: true,
    emailPaymentReceived: true,
    emailWeeklySummary: true,
    emailMarketingTips: false,
    
    // Push Notifications
    pushNewBooking: true,
    pushBookingReminder: true,
    pushTeamActivity: false,
    
    // SMS Notifications
    smsNewBooking: false,
    smsUrgentAlerts: true,
  });

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    // In production, this would save to backend
    toast.success("Notification preferences saved");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
          <p className="text-muted-foreground mt-1">
            Manage how you receive notifications and updates
          </p>
        </div>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <CardDescription>
              Receive updates and alerts via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Bookings</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a new booking is made
                </p>
              </div>
              <Switch
                checked={preferences.emailNewBooking}
                onCheckedChange={() => handleToggle("emailNewBooking")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Booking Cancellations</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a booking is canceled
                </p>
              </div>
              <Switch
                checked={preferences.emailBookingCanceled}
                onCheckedChange={() => handleToggle("emailBookingCanceled")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Payment Received</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a payment is received
                </p>
              </div>
              <Switch
                checked={preferences.emailPaymentReceived}
                onCheckedChange={() => handleToggle("emailPaymentReceived")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of your business performance
                </p>
              </div>
              <Switch
                checked={preferences.emailWeeklySummary}
                onCheckedChange={() => handleToggle("emailWeeklySummary")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Tips</Label>
                <p className="text-sm text-muted-foreground">
                  Receive tips and best practices for growing your business
                </p>
              </div>
              <Switch
                checked={preferences.emailMarketingTips}
                onCheckedChange={() => handleToggle("emailMarketingTips")}
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
            <CardDescription>
              Receive real-time notifications in your browser
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Bookings</Label>
                <p className="text-sm text-muted-foreground">
                  Instant notification when a booking is made
                </p>
              </div>
              <Switch
                checked={preferences.pushNewBooking}
                onCheckedChange={() => handleToggle("pushNewBooking")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Booking Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminders for upcoming bookings
                </p>
              </div>
              <Switch
                checked={preferences.pushBookingReminder}
                onCheckedChange={() => handleToggle("pushBookingReminder")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Team Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when team members make changes
                </p>
              </div>
              <Switch
                checked={preferences.pushTeamActivity}
                onCheckedChange={() => handleToggle("pushTeamActivity")}
              />
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>SMS Notifications</CardTitle>
            </div>
            <CardDescription>
              Receive important alerts via text message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Bookings</Label>
                <p className="text-sm text-muted-foreground">
                  Text message for new bookings
                </p>
              </div>
              <Switch
                checked={preferences.smsNewBooking}
                onCheckedChange={() => handleToggle("smsNewBooking")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Urgent Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Critical alerts that require immediate attention
                </p>
              </div>
              <Switch
                checked={preferences.smsUrgentAlerts}
                onCheckedChange={() => handleToggle("smsUrgentAlerts")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, Mail, Phone, Globe, MapPin, Palette } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { StripeConnectCard } from "@/components/StripeConnectCard";
import { useState, useEffect } from "react";

export default function Settings() {
  const { data: business, isLoading } = trpc.business.get.useQuery();
  const utils = trpc.useUtils();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState<string>("#2563eb");
  const [secondaryColor, setSecondaryColor] = useState<string>("#1e40af");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Update state when business data loads
  useEffect(() => {
    if (business) {
      // Sync initial values from business into local state on mount
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrimaryColor(business.primaryColor || "#2563eb");
       
      setSecondaryColor(business.secondaryColor || "#1e40af");
       
      setTheme(business.theme || "light");
    }
  }, [business]);

  const updateBusinessMutation = trpc.business.update.useMutation({
    onSuccess: () => {
      toast.success("Business profile updated successfully");
      utils.business.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateBusinessMutation.mutate({
      name: formData.get("name") as string,
  type: formData.get("type") as "tour_operator" | "hotel" | "restaurant" | "activity_provider" | "rental" | "other",
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      website: formData.get("website") as string,
      logoUrl: logoUrl || business?.logoUrl || undefined,
      vercelToken: formData.get("vercelToken") as string || undefined,
    });
  };

  const handleBrandingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateBusinessMutation.mutate({
      primaryColor,
      secondaryColor,
      theme,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No business profile found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile and preferences</p>
      </div>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Profile
          </CardTitle>
          <CardDescription>Update your business information</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Business ID Display */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Business ID</p>
                <p className="text-2xl font-mono font-bold">{business.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Use this ID for</p>
                <p className="text-xs text-muted-foreground">public site deployment</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUpload
              currentImage={business.logoUrl}
              onImageChange={setLogoUrl}
              label="Business Logo"
            />
            <div>
              <label className="block text-sm font-medium mb-2">Business Name *</label>
              <input
                type="text"
                name="name"
                required
                defaultValue={business.name}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Type *</label>
              <select
                name="type"
                required
                defaultValue={business.type}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="tour_operator">Tour Operator</option>
                <option value="hotel">Hotel / Accommodation</option>
                <option value="restaurant">Restaurant</option>
                <option value="activity_provider">Activity Provider</option>
                <option value="rental">Equipment Rental</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                rows={4}
                defaultValue={business.description || ""}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Tell customers about your business..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  defaultValue={business.location || ""}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Kalispell, MT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={business.phone || ""}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="(406) 555-0123"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Address</label>
              <input
                type="text"
                name="address"
                defaultValue={business.address || ""}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="123 Main St, Kalispell, MT 59901"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={business.email || ""}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="contact@yourbusiness.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  defaultValue={business.website || ""}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="https://yourbusiness.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vercel API Token (Optional)</label>
              <input
                type="password"
                name="vercelToken"
                defaultValue={business.vercelToken || ""}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                placeholder="vercel_xxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required for deploying your public website. Get your token from{" "}
                <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Vercel Dashboard
                </a>
              </p>
            </div>

            <Button type="submit" disabled={updateBusinessMutation.isPending}>
              {updateBusinessMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* OAuth Account Linking - DISABLED due to gateway routing issues
      <OAuthAccountsCard />
      */}

      {/* Branding & Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding & Customization
          </CardTitle>
          <CardDescription>
            Customize the appearance of your public booking site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBrandingSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-20 rounded border cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                      placeholder="#2563eb"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Main brand color used for buttons and headers
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Secondary Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-12 w-20 rounded border cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                      placeholder="#1e40af"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Accent color for hover states and highlights
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === "light"}
                    onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                    className="w-4 h-4"
                  />
                  <span>Light</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === "dark"}
                    onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                    className="w-4 h-4"
                  />
                  <span>Dark</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Choose the overall theme for your public booking site
              </p>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-6" style={{ backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff" }}>
              <p className="text-sm font-medium mb-3" style={{ color: theme === "dark" ? "#f3f4f6" : "#111827" }}>
                Preview
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  className="px-6 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  className="px-6 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Secondary Button
                </button>
              </div>
            </div>

            <Button type="submit" disabled={updateBusinessMutation.isPending}>
              {updateBusinessMutation.isPending ? "Saving..." : "Save Branding"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stripe Connect */}
      <StripeConnectCard />

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your TourismOS subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium capitalize">{business.subscriptionTier} Plan</p>
                <p className="text-sm text-muted-foreground">
                  Status: <span className="capitalize">{business.subscriptionStatus}</span>
                </p>
              </div>
              <Button variant="outline" onClick={() => window.location.href = '/subscription'}>
                Upgrade Plan
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Need to change your plan? Contact support or upgrade to unlock more features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

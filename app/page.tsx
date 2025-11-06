"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { useAuthNavigate } from "@/_core/hooks/useAuthNavigate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { trpc } from "@/lib/trpc";
import { 
  Mountain, 
  Bot, 
  Calendar, 
  BarChart3, 
  Mail, 
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import NextLink from 'next/link';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const navigate = useAuthNavigate();
  const { loading, isAuthenticated } = useAuth({ navigate });
  const router = useRouter();
  const { data: business, isLoading: businessLoading } = trpc.business.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Redirect to dashboard if user has a business
  useEffect(() => {
    if (!loading && isAuthenticated && business) {
      router.push("/dashboard");
    }
  }, [loading, isAuthenticated, business, router]);

  if (loading || businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show onboarding if authenticated but no business
  if (isAuthenticated && !business) {
    return <BusinessOnboarding />;
  }

  // Show landing page for non-authenticated users
  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">TourismOS</span>
          </div>
          <Button asChild>
            <NextLink href="/auth" className="inline-flex items-center">Get Started</NextLink>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            AI-Powered Operations for
            <span className="text-primary"> Tourism Businesses</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automate bookings, engage customers 24/7 with AI chatbots, and grow your tourism business with intelligent marketing tools.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <NextLink href="/auth" className="inline-flex items-center">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </NextLink>
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
          <p className="text-muted-foreground">Built specifically for tourism and hospitality businesses</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Bot className="h-6 w-6" />}
            title="AI Chatbot"
            description="24/7 customer support that answers questions, provides recommendations, and handles bookings automatically."
          />
          <FeatureCard
            icon={<Calendar className="h-6 w-6" />}
            title="Smart Booking System"
            description="Manage reservations, track availability, and process payments seamlessly."
          />
          <FeatureCard
            icon={<Mail className="h-6 w-6" />}
            title="Marketing Automation"
            description="AI-generated emails and social media posts that engage customers and drive bookings."
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Business Intelligence"
            description="Real-time analytics and AI-powered insights to optimize pricing and operations."
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="Dynamic Pricing"
            description="AI-driven pricing recommendations based on demand, seasonality, and competition."
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="All-in-One Platform"
            description="Replace 5-10 separate tools with one integrated solution designed for tourism."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join Montana&apos;s leading tourism businesses using TourismOS
          </p>
          <Button size="lg" variant="secondary" asChild>
            <NextLink href="/auth" className="inline-flex items-center">
              Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </NextLink>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 TourismOS. Built for Montana tourism businesses.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function BusinessTypeSelect({ name = "type", initial = "" }: { name?: string; initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={(v) => setValue(v)}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {value ? value : <span className="text-muted-foreground">Select a type...</span>}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tour_operator">Tour Operator</SelectItem>
          <SelectItem value="hotel">Hotel / Accommodation</SelectItem>
          <SelectItem value="restaurant">Restaurant</SelectItem>
          <SelectItem value="activity_provider">Activity Provider</SelectItem>
          <SelectItem value="rental">Equipment Rental</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function BusinessOnboarding() {
  const router = useRouter();

  const createBusinessMutation = trpc.business.create.useMutation({
    onSuccess: () => {
      toast.success("Business created successfully!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createBusinessMutation.mutate({
      name: formData.get("name") as string,
      type: formData.get("type") as "tour_operator" | "hotel" | "restaurant" | "activity_provider" | "rental" | "other",
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      website: formData.get("website") as string,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <Mountain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">TourismOS</span>
          </div>
          <CardTitle className="text-2xl">Welcome! Let&apos;s set up your business</CardTitle>
          <CardDescription>
            Tell us about your tourism business to get started with TourismOS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name *</label>
              <Input
                type="text"
                name="name"
                required
                className="w-full"
                placeholder="Montana Adventures"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Type *</label>
              <BusinessTypeSelect name="type" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea name="description" rows={3} placeholder="Tell us about your business..." />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  type="text"
                  name="location"
                  className="w-full"
                  placeholder="Kalispell, MT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  type="tel"
                  name="phone"
                  className="w-full"
                  placeholder="(406) 555-0123"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                name="email"
                className="w-full"
                placeholder="contact@yourbusiness.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <Input
                type="url"
                name="website"
                className="w-full"
                placeholder="https://yourbusiness.com"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createBusinessMutation.isPending}
            >
              {createBusinessMutation.isPending ? "Creating..." : "Create Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


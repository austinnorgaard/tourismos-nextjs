'use client';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useRouter } from 'next/navigation';
import { Check, CreditCard, Zap, Crown, Rocket } from "lucide-react";
import { toast } from "sonner";

const tiers = [
  {
    name: "Starter",
    value: "starter" as const,
    price: "$99",
    period: "/month",
    description: "Perfect for small businesses just getting started",
    icon: Rocket,
    features: [
      "Up to 50 bookings/month",
      "Basic AI chatbot",
      "Email support",
      "1 team member",
      "Basic analytics",
    ],
  },
  {
    name: "Professional",
    value: "professional" as const,
    price: "$299",
    period: "/month",
    description: "For growing businesses that need more power",
    icon: Zap,
    popular: true,
    features: [
      "Up to 500 bookings/month",
      "Advanced AI chatbot with semantic search",
      "Priority email & chat support",
      "Up to 5 team members",
      "Advanced analytics & insights",
      "Marketing automation",
      "Custom branding",
    ],
  },
  {
    name: "Enterprise",
    value: "enterprise" as const,
    price: "$999",
    period: "/month",
    description: "For large operations with custom needs",
    icon: Crown,
    features: [
      "Unlimited bookings",
      "Full AI suite with custom training",
      "24/7 phone & email support",
      "Unlimited team members",
      "Custom integrations",
      "Dedicated account manager",
      "White-label options",
      "API access",
    ],
  },
];

export default function Subscription() {
  const router = useRouter();
  const { data: business } = trpc.business.get.useQuery();
  
  const createCheckoutMutation = trpc.payment.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        try {
          const u = new URL(data.url);
          if (u.origin === window.location.origin) {
            router.push(u.pathname + u.search + u.hash);
            return;
          }
        } catch (e) {}
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpgrade = (tier: "starter" | "professional" | "enterprise") => {
    if (business?.subscriptionTier === tier) {
      toast.info("You're already on this plan");
      return;
    }
    
    createCheckoutMutation.mutate({ tier });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Subscription & Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription plan and billing information
          </p>
        </div>

        {/* Current Plan */}
        {business && (
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are currently on the {business.subscriptionTier} plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold capitalize">{business.subscriptionTier}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Status: <span className={`font-medium ${
                      business.subscriptionStatus === "active" ? "text-green-600" :
                      business.subscriptionStatus === "trial" ? "text-blue-600" :
                      "text-red-600"
                    }`}>
                      {business.subscriptionStatus}
                    </span>
                  </div>
                </div>
                <CreditCard className="h-12 w-12 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Tiers */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isCurrentPlan = business?.subscriptionTier === tier.value;
              
              return (
                <Card
                  key={tier.value}
                  className={`relative ${tier.popular ? "border-primary shadow-lg" : ""}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.period}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      className="w-full"
                      variant={tier.popular ? "default" : "outline"}
                      disabled={isCurrentPlan || createCheckoutMutation.isPending}
                      onClick={() => handleUpgrade(tier.value)}
                    >
                      {isCurrentPlan ? "Current Plan" : 
                       createCheckoutMutation.isPending ? "Processing..." : 
                       "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>
              Manage your payment methods and billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {business?.stripeCustomerId ? (
                <div className="text-sm text-muted-foreground">
                  Stripe Customer ID: {business.stripeCustomerId}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No payment method on file
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Button variant="outline">
                  View Billing History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

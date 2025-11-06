/**
 * Stripe Product and Price Definitions for TourismOS
 * 
 * This file contains all product/price configurations for easy management.
 * Update prices here and they'll be reflected throughout the application.
 */

export const SUBSCRIPTION_PRODUCTS = {
  starter: {
    name: "Starter Plan",
    description: "Perfect for small tourism businesses just getting started",
    priceId: "price_starter", // Replace with actual Stripe price ID
    price: 9900, // $99/month in cents
    interval: "month" as const,
    features: [
      "Up to 50 bookings/month",
      "AI Chatbot (500 messages/month)",
      "Basic analytics",
      "Email support",
      "1 user account",
    ],
  },
  professional: {
    name: "Professional Plan",
    description: "For growing businesses with higher volume",
    priceId: "price_professional", // Replace with actual Stripe price ID
    price: 24900, // $249/month in cents
    interval: "month" as const,
    features: [
      "Up to 200 bookings/month",
      "AI Chatbot (2,000 messages/month)",
      "Advanced analytics & insights",
      "AI marketing tools",
      "Priority email support",
      "Up to 5 user accounts",
      "Custom branding",
    ],
  },
  enterprise: {
    name: "Enterprise Plan",
    description: "For established businesses with high volume needs",
    priceId: "price_enterprise", // Replace with actual Stripe price ID
    price: 49900, // $499/month in cents
    interval: "month" as const,
    features: [
      "Unlimited bookings",
      "AI Chatbot (unlimited messages)",
      "Full analytics suite",
      "AI marketing automation",
      "Phone & email support",
      "Unlimited user accounts",
      "Custom branding & white-label",
      "API access",
      "Dedicated account manager",
    ],
  },
};

export const ONE_TIME_PRODUCTS = {
  setupFee: {
    name: "Business Setup & Onboarding",
    description: "One-time setup fee for new businesses",
    priceId: "price_setup", // Replace with actual Stripe price ID
    price: 29900, // $299 one-time
  },
  customIntegration: {
    name: "Custom Integration",
    description: "Custom API integration with your existing systems",
    priceId: "price_custom_integration", // Replace with actual Stripe price ID
    price: 99900, // $999 one-time
  },
};

/**
 * Helper function to get product by tier
 */
export function getSubscriptionProduct(tier: "starter" | "professional" | "enterprise") {
  return SUBSCRIPTION_PRODUCTS[tier];
}

/**
 * Helper function to format price for display
 */
export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

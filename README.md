# TourismOS - Next.js Edition

A modern tourism management platform built with Next.js 14, tRPC, and TypeScript.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.local .env.production
# Edit .env.production with your values

# Run development server
pnpm dev 

# Open http://localhost:3000
```

## 📋 Prerequisites

- Node.js 18+ 
- pnpm 8+
- MySQL or TiDB database
- Stripe account (for payments)

## 🏗️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **API:** tRPC 11 with superjson
- **Database:** MySQL/TiDB with Drizzle ORM
- **Auth:** JWT with HTTP-only cookies
- **Payments:** Stripe
- **Styling:** Tailwind CSS v3
- **UI Components:** Radix UI + shadcn/ui
- **Type Safety:** TypeScript

## 📦 Features

### For Business Owners
- ✅ Business profile management
- ✅ Service/offering creation and management
- ✅ Booking management and tracking
- ✅ Stripe Connect for payments
- ✅ Analytics and reporting
- ✅ AI-powered chatbot
- ✅ Marketing automation
- ✅ Customer segmentation
- ✅ Email campaigns
- ✅ Integration with third-party services

### For Customers (Public Booking App)
- ✅ Browse available offerings
- ✅ Make bookings
- ✅ Secure payment processing
- ✅ Booking confirmation emails
- ✅ Customizable branding per business

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables (see below)
4. Deploy!

**See [Migration Guide](./docs/MIGRATION_GUIDE.md) for detailed instructions.**

### Environment Variables

```bash
# Database
DATABASE_URL="mysql://user:pass@host:port/db"

# Authentication
JWT_SECRET="your-secret-key"

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# App Configuration
NEXT_PUBLIC_APP_TITLE="TourismOS"
NEXT_PUBLIC_APP_LOGO="https://..."
```

## 📖 Documentation

- [Migration Guide](./docs/MIGRATION_GUIDE.md) - Complete migration and deployment guide
- [Migration Summary](./docs/MIGRATION_SUMMARY.md) - Short completion summary
- [Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md) - Pre/post deployment checklist
- [Next.js Docs](https://nextjs.org/docs)
- [tRPC Docs](https://trpc.io/docs)

## 🔧 Development

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
```

## 📝 License

Proprietary - All rights reserved

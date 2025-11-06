# Deployment Checklist

## Pre-Deployment

### 1. Code Preparation
- [ ] All files committed to Git
- [ ] `.env.local` added to `.gitignore`
- [ ] No sensitive data in code
- [ ] All TODO comments addressed or documented

### 2. Environment Variables
Set these in Vercel dashboard:

**Required:**
- [ ] `DATABASE_URL` - MySQL connection string
- [ ] `JWT_SECRET` - Secure random string (32+ chars)
- [ ] `STRIPE_SECRET_KEY` - From Stripe dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe webhooks
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard

**Optional:**
- [ ] `NEXT_PUBLIC_APP_TITLE` - Your app name
- [ ] `NEXT_PUBLIC_APP_LOGO` - Logo URL
- [ ] `NEXT_PUBLIC_FRONTEND_FORGE_API_KEY` - For maps/AI features
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - For emails

### 3. Database Setup
- [ ] Database created and accessible
- [ ] Connection string tested
- [ ] Tables created (run `pnpm drizzle-kit push`)
- [ ] Database whitelisted Vercel IPs (if applicable)

### 4. Stripe Configuration
- [ ] Stripe account created
- [ ] API keys obtained (test and live)
- [ ] Webhook endpoint configured: `https://your-domain.vercel.app/api/stripe`
- [ ] Webhook secret obtained
- [ ] Products/prices created in Stripe dashboard

## Deployment Steps

### 1. Push to GitHub
```bash
cd /home/ubuntu/tourismos-nextjs
git init
git add .
git commit -m "Initial Next.js deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tourismos-nextjs.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to https://vercel.com/new
2. Import GitHub repository
3. Configure project:
   - Framework: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`
4. Add environment variables (see above)
5. Click "Deploy"

### 3. Post-Deployment
- [ ] Test homepage loads
- [ ] Test authentication (login/logout)
- [ ] Test tRPC endpoints
- [ ] Test database connectivity
- [ ] Test Stripe webhooks
- [ ] Test booking flow
- [ ] Test email notifications

## Verification

### Health Checks
- [ ] `/` - Homepage loads
- [ ] `/api/trpc/auth.me` - Returns user or null
- [ ] Stripe webhook logs show successful deliveries
- [ ] Database shows new records when creating data

### Performance
- [ ] Lighthouse score > 80
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s

### Security
- [ ] HTTPS enabled
- [ ] Environment variables not exposed in client
- [ ] JWT tokens HTTP-only
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (if applicable)

## Rollback Plan

If deployment fails:
1. Check Vercel build logs
2. Verify environment variables
3. Test database connection
4. Roll back to previous deployment in Vercel dashboard

## Monitoring

Set up monitoring for:
- [ ] Error tracking (Sentry, etc.)
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Database performance

## Support

For issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Review [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
4. Check Next.js documentation

## Notes

- First build may take 5-10 minutes
- Subsequent builds are faster (cached)
- Vercel automatically handles SSL certificates
- Auto-scaling is handled by Vercel

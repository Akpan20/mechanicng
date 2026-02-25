# 🔧 MechanicNG — *Find. Fix. Move.*

**Nigeria's trusted mechanic directory.** A full-stack, multi-tenant web application for connecting Nigerian drivers with verified mechanics and auto shops.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Radix UI |
| State | Zustand + TanStack React Query |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Database | PostgreSQL with PostGIS (geo queries) |
| Payments | Paystack (NGN subscriptions) |
| Maps | Leaflet.js + OpenStreetMap (free, no billing) |
| Email | Resend via Supabase Edge Functions |
| Analytics | PostHog |
| Hosting | Vercel (frontend) + Supabase (backend) |
| CI/CD | GitHub Actions |
| PWA | vite-plugin-pwa (installable, offline-ready) |

---

## 🚀 Quick Start (Local Development)

### 1. Clone and install

```bash
git clone https://github.com/yourorg/mechanicng.git
cd mechanicng
npm install
```

### 2. Set up Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase (requires Docker)
supabase start

# Run migrations
supabase db push

# Generate TypeScript types
npm run db:types
```

### 3. Configure environment

```bash
cp .env.example .env.local
# Fill in your values:
# VITE_SUPABASE_URL — from supabase start output or your Supabase project
# VITE_SUPABASE_ANON_KEY — from supabase start output
# VITE_PAYSTACK_PUBLIC_KEY — from Paystack dashboard
```

### 4. Start development server

```bash
npm run dev
# → http://localhost:5173
```

---

## 🌐 Production Deployment

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region closest to Nigeria (e.g. **Europe West** is closest available)
3. Copy your **Project URL** and **Anon Key** from Settings → API
4. Copy your **Service Role Key** (keep this secret — server-side only)
5. Run migrations: `supabase db push --project-ref YOUR_PROJECT_REF`

### Step 2 — Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set production env vars
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_PAYSTACK_PUBLIC_KEY production
vercel env add VITE_POSTHOG_KEY production
```

Or connect your GitHub repo to Vercel for automatic deployments on push.

### Step 3 — Deploy Edge Functions

```bash
supabase functions deploy paystack-webhook --project-ref YOUR_PROJECT_REF
supabase functions deploy send-quote-email --project-ref YOUR_PROJECT_REF

# Set edge function secrets
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx --project-ref YOUR_PROJECT_REF
supabase secrets set RESEND_API_KEY=re_xxx --project-ref YOUR_PROJECT_REF
supabase secrets set APP_URL=https://mechanicng.com --project-ref YOUR_PROJECT_REF
```

### Step 4 — Configure Paystack

1. Log in to [paystack.com](https://paystack.com)
2. Create two subscription plans:
   - **Standard**: ₦2,500/month → copy Plan Code to `PLANS` in `src/lib/constants.ts`
   - **Pro**: ₦6,000/month → copy Plan Code
3. Set webhook URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook`
4. Enable events: `charge.success`, `subscription.create`, `subscription.disable`

### Step 5 — Set Up GitHub Actions CI/CD

Add these secrets to your GitHub repo (Settings → Secrets):

| Secret | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | Supabase project settings |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack dashboard |
| `VITE_POSTHOG_KEY` | PostHog project settings |
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel whoami` |
| `VERCEL_PROJECT_ID` | Vercel project settings |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | Your Supabase project ref |

### Step 6 — Create Admin Account

After deploying, create your admin user:

```sql
-- Run in Supabase SQL Editor
-- First sign up normally at /signup, then:
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin@email.com';
```

### Step 7 — Custom Domain

In Vercel → Your Project → Settings → Domains, add:
- `mechanicng.com`
- `www.mechanicng.com`

Then update Supabase Auth allowed URLs to include your domain.

---

## 📁 Project Structure

```
mechanicng/
├── src/
│   ├── components/
│   │   ├── layout/       # Navbar, Layout, Footer
│   │   ├── mechanic/     # MechanicCard, ProfileActions
│   │   ├── admin/        # Admin components
│   │   └── dashboard/    # Dashboard widgets
│   ├── pages/            # One file per route
│   ├── hooks/            # useAuth, useMechanics, useQuotes, useGeolocation
│   ├── lib/
│   │   ├── api/          # Supabase query functions
│   │   ├── supabase.ts   # Supabase client
│   │   ├── paystack.ts   # Paystack integration
│   │   ├── geo.ts        # Haversine, geocoding
│   │   ├── constants.ts  # Services, cities, plan configs
│   │   └── queryKeys.ts  # React Query cache keys
│   ├── store/            # Zustand: authStore, searchStore
│   └── types/            # TypeScript domain types
├── supabase/
│   ├── migrations/       # SQL schema + functions
│   └── functions/        # Edge functions (Paystack, Email)
├── .github/workflows/    # CI/CD pipeline
├── vercel.json           # Vercel routing + security headers
└── supabase/config.toml  # Local dev config
```

---

## 🔐 Security Model (Row Level Security)

| Table | Public | Mechanic (own) | Admin |
|---|---|---|---|
| `mechanics` | Read approved only | Read + Update own | Full access |
| `reviews` | Read all | Insert | Full access |
| `quote_requests` | Insert | Read + Update own | Full access |
| `subscriptions` | — | Read own | Full access |
| `profiles` | — | Read + Update own | Read all |

---

## 📊 Database Schema

- **profiles** — User accounts with roles (user/mechanic/admin)
- **mechanics** — Listings with PostGIS geography for geo queries
- **reviews** — Customer reviews with auto-rating trigger
- **quote_requests** — Customer-to-mechanic quote inbox
- **subscriptions** — Paystack subscription tracking

---

## 🔧 Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run db:types     # Regenerate Supabase types
npm run db:migrate   # Push migrations to Supabase
npm run db:reset     # Reset local database
```

---

## 💳 Subscription Plans

| Plan | Price | Paystack |
|---|---|---|
| Free | ₦0 | No charge |
| Standard | ₦2,500/month | Recurring subscription |
| Pro | ₦6,000/month | Recurring subscription |

---

## 📱 PWA / Mobile

The app is a Progressive Web App. On mobile:
- Users can "Add to Home Screen" for app-like experience
- Works offline for previously cached pages
- Full mobile-responsive layout

---

## 🌍 Environment Variables Reference

```env
# Required
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PAYSTACK_PUBLIC_KEY=

# Optional (analytics)
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://app.posthog.com

# App
VITE_APP_URL=https://mechanicng.com
VITE_APP_NAME=MechanicNG

# Edge functions (Supabase secrets, NOT in .env)
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
RESEND_API_KEY=
```

---

Built with ❤️ for Nigerian roads. 🇳🇬

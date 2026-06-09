# CVMatch — ATS CV Optimiser

A Next.js app that rewrites CVs to be ATS-optimised for a specific job description. One-time payment (£19.99) via Stripe. Results stored in Supabase.

---

## Tech Stack

- **Frontend/Backend**: Next.js 14 (Pages Router)
- **AI**: OpenAI GPT-4o
- **Payments**: Stripe (one-time checkout)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

---

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```
Then fill in all values (see below for where to get each one).

### 3. Set up Supabase
1. Create a project at https://supabase.com
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Copy your Project URL and keys into `.env.local`

### 4. Set up Stripe
1. Create account at https://stripe.com
2. Get publishable + secret keys from Dashboard → Developers → API Keys
3. For webhooks (local testing): install Stripe CLI and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   Copy the webhook signing secret into `.env.local`

### 5. Set up OpenAI
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env.local`

### 6. Run locally
```bash
npm run dev
```
Visit http://localhost:3000

---

## Deploying to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/cv-optimizer.git
git push -u origin main
```

### 2. Import to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Add all environment variables from `.env.local` in the Vercel dashboard
4. Change `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g. `https://cvmatch.vercel.app`)
5. Deploy

### 3. Set up Stripe webhook for production
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-vercel-url.vercel.app/api/webhook`
3. Select event: `checkout.session.completed`
4. Copy the signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel env vars
5. Redeploy

---

## Environment Variables Reference

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, your Vercel URL in prod |

---

## User Flow

1. User pastes CV + job description on homepage
2. `/api/analyze` — calls GPT-4o to rewrite CV and score it, stores in Supabase, returns preview + scores (session = `pending`)
3. `/preview` — shows score rings, improvements, blurred preview
4. User clicks Pay → `/api/checkout` creates Stripe checkout session
5. Stripe processes payment, sends webhook to `/api/webhook` → marks session as `paid`
6. User redirected to `/result?session_id=...&status=success`
7. `/result` polls `/api/result` until payment confirmed, then shows full CV + download

---

## Pricing

Currently set to £19.99 GBP. To change, edit `unit_amount` in `/pages/api/checkout.ts` (value is in pence, so 1999 = £19.99).

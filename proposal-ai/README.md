# ProposalAI

AI-powered freelance proposal generator. Pay once via Paddle, get a tailored proposal from GPT-4o.

## Stack

- **Next.js 14** (Pages Router)
- **Supabase** — stores form inputs before payment, proposal after
- **Paddle Classic** — payment + webhooks
- **OpenAI GPT-4o** — proposal generation (fires only after confirmed payment)

## Project structure

```
pages/
  index.tsx          ← Form + Paddle checkout
  result.tsx         ← Polls for proposal after payment
  api/
    save-session.ts  ← Saves form inputs, returns sessionId
    webhook.ts       ← Paddle webhook: marks paid, calls OpenAI
    result.ts        ← Fetches proposal by sessionId
lib/
  supabase.ts
  openai.ts
  paddle.ts
styles/
  globals.css
supabase-schema.sql  ← Run this in Supabase SQL editor first
```

## Setup

### 1. Supabase

1. Create a new Supabase project
2. Open the SQL editor and run `supabase-schema.sql`
3. Copy your project URL, anon key, and service role key

### 2. Paddle Classic

1. Log in to your Paddle dashboard
2. Note your **Vendor ID** and **Plan/Product ID**
3. Get your **Public Key** from Developer Tools → Public Key
4. Set up a webhook pointing to `https://yourdomain.com/api/webhook`
   - Events: `subscription_created`, `subscription_payment_succeeded`

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_PADDLE_VENDOR_ID=300787
NEXT_PUBLIC_PADDLE_PLAN_ID=pri_01kt1...
PADDLE_API_KEY=...
PADDLE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all env vars in the Vercel dashboard under **Settings → Environment Variables**.

Then set your Paddle webhook URL to your Vercel production URL + `/api/webhook`.

## Local dev

```bash
npm install
npm run dev
```

Use [ngrok](https://ngrok.com) or [localtunnel](https://theboroer.github.io/localtunnel-www/) to expose localhost for Paddle webhooks during development.

## Flow

1. User fills form → `POST /api/save-session` → returns `sessionId`
2. Paddle checkout opens with `sessionId` as `passthrough`
3. On payment, Paddle calls `POST /api/webhook`
4. Webhook verifies signature → marks session `paid` → calls OpenAI → saves proposal
5. Frontend polls `GET /api/result?sessionId=...` every 2s until proposal is ready

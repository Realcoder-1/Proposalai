import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { optimizeCV } from '@/lib/openai'
import Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

async function buffer(readable: NextApiRequest) {
  const chunks: Buffer[] = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    const buf = await buffer(req)
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // ✅ Payment confirmed — NOW we call OpenAI
  if (event.type === 'checkout.session.completed') {
    const stripeSession = event.data.object as Stripe.Checkout.Session
    const sessionId = stripeSession.metadata?.sessionId

    if (!sessionId) {
      console.error('No sessionId in Stripe metadata')
      return res.status(200).json({ received: true })
    }

    const db = supabaseAdmin()

    // Fetch the raw CV and job description saved before payment
    const { data: cvSession, error } = await db
      .from('cv_sessions')
      .select('original_cv, job_description, before_score')
      .eq('session_id', sessionId)
      .single()

    if (error || !cvSession) {
      console.error('Session not found for sessionId:', sessionId)
      return res.status(200).json({ received: true })
    }

    // Mark as paid immediately so result page stops showing "pending"
    await db
      .from('cv_sessions')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_session_id: stripeSession.id,
      })
      .eq('session_id', sessionId)

    // Now fire the OpenAI call — only happens after real payment
    try {
      const result = await optimizeCV(cvSession.original_cv, cvSession.job_description)

      await db
        .from('cv_sessions')
        .update({
          optimized_cv: result.optimizedCV,
          after_score: result.afterScore,
          improvements: result.improvements,
          keywords: result.keywords,
        })
        .eq('session_id', sessionId)

    } catch (aiError) {
      console.error('OpenAI error after payment:', aiError)
      // Don't fail the webhook — payment is confirmed, we'll handle retry separately
      // In production you'd want a retry queue here (e.g. a cron job that checks paid sessions with no optimized_cv)
    }
  }

  res.status(200).json({ received: true })
}

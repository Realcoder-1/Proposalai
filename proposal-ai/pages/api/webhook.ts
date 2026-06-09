import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { generateProposal } from '@/lib/openai'
import { verifyPaddleWebhook } from '@/lib/paddle'

export const config = { api: { bodyParser: true } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const body = req.body

  // Verify webhook is genuinely from Paddle
  const isValid = verifyPaddleWebhook(body)
  if (!isValid) {
    console.error('Invalid Paddle webhook signature')
    return res.status(400).json({ error: 'Invalid signature' })
  }

  const alertName = body.alert_name
  const sessionId = body.passthrough // we pass sessionId as passthrough when creating checkout

  // Handle both new subscription and payment events
  if (
    alertName === 'subscription_created' ||
    alertName === 'subscription_payment_succeeded'
  ) {
    if (!sessionId) {
      console.error('No sessionId in passthrough')
      return res.status(200).json({ received: true })
    }

    const db = supabaseAdmin()

    // Fetch the raw inputs saved before payment
    const { data: session, error } = await db
      .from('proposal_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error || !session) {
      console.error('Session not found:', sessionId)
      return res.status(200).json({ received: true })
    }

    // Mark as paid immediately
    await db
      .from('proposal_sessions')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        paddle_subscription_id: body.subscription_id || null,
      })
      .eq('session_id', sessionId)

    // NOW fire OpenAI — only after real payment confirmed
    try {
      const result = await generateProposal({
        clientBrief: session.client_brief,
        yourRole: session.your_role,
        dayRate: session.day_rate,
        approach: session.approach,
        timeline: session.timeline,
        yourName: session.your_name,
      })

      await db
        .from('proposal_sessions')
        .update({
          proposal: result.proposal,
          word_count: result.wordCount,
        })
        .eq('session_id', sessionId)

    } catch (aiError) {
      console.error('OpenAI error after payment:', aiError)
      // Payment is confirmed — log error but don't fail webhook
    }
  }

  return res.status(200).json({ received: true })
}

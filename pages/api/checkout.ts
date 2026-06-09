import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { sessionId } = req.body
  if (!sessionId) return res.status(400).json({ error: 'Session ID required' })

  const db = supabaseAdmin()
  const { data: session, error } = await db
    .from('cv_sessions')
    .select('id, payment_status')
    .eq('session_id', sessionId)
    .single()

  if (error || !session) return res.status(404).json({ error: 'Session not found' })
  if (session.payment_status === 'paid') return res.status(400).json({ error: 'Already paid' })

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: 1999, // £19.99
            product_data: {
              name: 'CV Optimisation — Full Download',
              description: 'ATS-optimised CV tailored to your job description. One-time payment, instant download.',
            },
          },
          quantity: 1,
        },
      ],
      // Pass sessionId in metadata so webhook knows which record to update
      metadata: { sessionId },
      success_url: `${appUrl}/result?session_id=${sessionId}&status=success`,
      cancel_url: `${appUrl}/?canceled=true`,
    })

    await db
      .from('cv_sessions')
      .update({ stripe_session_id: checkoutSession.id })
      .eq('session_id', sessionId)

    return res.status(200).json({ url: checkoutSession.url })
  } catch (err: any) {
    console.error('Stripe error:', err)
    return res.status(500).json({ error: 'Failed to create payment session' })
  }
}

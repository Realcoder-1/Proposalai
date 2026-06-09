import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { sessionId } = req.query
  if (!sessionId) return res.status(400).json({ error: 'Session ID required' })

  const db = supabaseAdmin()
  const { data: session, error } = await db
    .from('cv_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error || !session) return res.status(404).json({ error: 'Session not found' })

  // Payment not confirmed yet
  if (session.payment_status !== 'paid') {
    return res.status(403).json({ error: 'Payment required', status: 'unpaid' })
  }

  // Paid but AI still processing (webhook fired, OpenAI not done yet)
  if (!session.optimized_cv) {
    return res.status(202).json({ error: 'Still processing', status: 'processing' })
  }

  // All good — return full result
  return res.status(200).json({
    optimizedCV: session.optimized_cv,
    beforeScore: session.before_score,
    afterScore: session.after_score,
    improvements: session.improvements,
    keywords: session.keywords,
  })
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { sessionId } = req.query
  if (!sessionId) return res.status(400).json({ error: 'Session ID required' })

  const db = supabaseAdmin()
  const { data: session, error } = await db
    .from('proposal_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error || !session) return res.status(404).json({ error: 'Session not found' })

  if (session.payment_status !== 'paid') {
    return res.status(403).json({ error: 'Payment required', status: 'unpaid' })
  }

  if (!session.proposal) {
    return res.status(202).json({ error: 'Still generating', status: 'processing' })
  }

  return res.status(200).json({
    proposal: session.proposal,
    wordCount: session.word_count,
    yourName: session.your_name,
  })
}

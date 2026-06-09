import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientBrief, yourRole, dayRate, approach, timeline, yourName, email } = req.body

  if (!clientBrief || !yourRole || !dayRate || !approach || !timeline || !yourName) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  const sessionId = crypto.randomUUID()

  const { error } = await supabase.from('proposal_sessions').insert({
    session_id: sessionId,
    client_brief: clientBrief,
    your_role: yourRole,
    day_rate: dayRate,
    approach: approach,
    timeline: timeline,
    your_name: yourName,
    email: email || null,
    payment_status: 'pending',
  })

  if (error) {
    console.error('DB error:', error)
    return res.status(500).json({ error: 'Failed to save session' })
  }

  return res.status(200).json({ sessionId })
}

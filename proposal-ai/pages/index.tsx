import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

declare global {
  interface Window { Paddle: any }
}

const inputStyle = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '12px 14px',
  color: 'var(--text)',
  fontFamily: 'Syne, sans-serif',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
}

const labelStyle = {
  display: 'block' as const,
  fontSize: 12,
  fontWeight: 600 as const,
  marginBottom: 8,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-muted)',
}

export default function Home() {
  const router = useRouter()
  const [form, setForm] = useState({
    yourName: '',
    yourRole: '',
    dayRate: '',
    email: '',
    clientBrief: '',
    approach: '',
    timeline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string) => (e: any) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async () => {
    const { yourName, yourRole, dayRate, clientBrief, approach, timeline } = form
    if (!yourName || !yourRole || !dayRate || !clientBrief || !approach || !timeline) {
      setError('Please fill in all required fields.')
      return
    }
    if (clientBrief.length < 50) {
      setError('Client brief is too short — add more detail.')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Save inputs to Supabase — no AI yet
      const res = await fetch('/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }

      const { sessionId } = data

      // Open Paddle checkout — passthrough carries sessionId
      // Paddle Classic uses inline JS checkout
      if (typeof window !== 'undefined' && window.Paddle) {
        window.Paddle.Checkout.open({
          vendor: Number(process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID),
          product: process.env.NEXT_PUBLIC_PADDLE_PLAN_ID,
          email: form.email || undefined,
          passthrough: sessionId,
          successCallback: () => {
            router.push(`/result?session_id=${sessionId}&status=success`)
          },
          closeCallback: () => {
            setLoading(false)
          },
        })
      } else {
        setError('Payment system not loaded. Please refresh and try again.')
        setLoading(false)
      }
    } catch (e) {
      console.error(e)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>ProposalAI — Win More Freelance Work</title>
        <meta name="description" content="Paste a client brief, answer 4 questions, get a winning proposal in 60 seconds. £29/month." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Paddle Classic JS */}
        <script src="https://cdn.paddle.com/paddle/paddle.js" async />
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              if (window.Paddle) {
                Paddle.Setup({ vendor: ${process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID || 300787} });
              }
            });
          `
        }} />
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          padding: '20px 40px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>ProposalAI</span>
          </div>
          <div style={{
            padding: '5px 14px', border: '1px solid var(--border)',
            borderRadius: 20, fontSize: 13, color: 'var(--text-muted)',
            fontFamily: 'DM Mono, monospace',
          }}>£29/month</div>
        </header>

        <main style={{ flex: 1, maxWidth: 860, margin: '0 auto', padding: '56px 24px', width: '100%' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{
              display: 'inline-block', padding: '4px 14px',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 20, fontSize: 11, color: 'var(--accent)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 20, fontFamily: 'DM Mono, monospace',
            }}>For UK Freelancers</div>
            <h1 style={{
              fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 800,
              lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16,
            }}>
              Stop losing work to<br />
              <span style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>badly written proposals.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
              Paste the brief. Answer four questions. Get a tailored, professional proposal in 60 seconds — ready to send.
            </p>
          </div>

          {/* Form */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '36px', marginBottom: 24,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 28, letterSpacing: '-0.01em' }}>
              Tell us about the project
            </h2>

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Your name *</label>
                <input value={form.yourName} onChange={set('yourName')} placeholder="Alex Johnson"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={labelStyle}>Your role *</label>
                <input value={form.yourRole} onChange={set('yourRole')} placeholder="UX Designer"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={labelStyle}>Day rate *</label>
                <input value={form.dayRate} onChange={set('dayRate')} placeholder="£450/day"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Timeline *</label>
                <input value={form.timeline} onChange={set('timeline')} placeholder="4 weeks"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={labelStyle}>Your email (optional)</label>
                <input value={form.email} onChange={set('email')} placeholder="you@example.com" type="email"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {/* Client brief */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Client brief *</label>
              <textarea value={form.clientBrief} onChange={set('clientBrief')}
                placeholder="Paste the client's brief here — the more detail the better. Include their goals, deliverables, any context they gave you…"
                style={{ ...inputStyle, height: 140, resize: 'vertical' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent2)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{form.clientBrief.length} characters</div>
            </div>

            {/* Approach */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Your proposed approach *</label>
              <textarea value={form.approach} onChange={set('approach')}
                placeholder="How will you tackle this project? What's your process? What makes your approach different? Even rough notes are fine…"
                style={{ ...inputStyle, height: 120, resize: 'vertical' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent2)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: 20, padding: '12px 16px',
                background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
                borderRadius: 8, color: 'var(--danger)', fontSize: 14,
              }}>{error}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '15px 48px',
                  background: loading ? 'var(--border)' : 'linear-gradient(135deg, var(--accent), #4f46e5)',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 0 28px rgba(99,102,241,0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Opening payment…' : 'Generate My Proposal →'}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
              £29/month · cancel anytime · proposal ready in ~60 seconds after payment
            </p>
          </div>

          {/* Trust row */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['🔒 Secure via Paddle', '🇬🇧 UK English', '📋 Copy or download', '⚡ 60 second turnaround'].map((t, i) => (
              <span key={i} style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t}</span>
            ))}
          </div>
        </main>
      </div>
    </>
  )
}

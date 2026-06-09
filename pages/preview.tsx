import { useRouter } from 'next/router'
import Head from 'next/head'
import { useState } from 'react'
import ScoreRing from '@/components/ScoreRing'

export default function Preview() {
  const router = useRouter()
  const { sessionId, beforeScore, keywords } = router.query

  const [paying, setPaying] = useState(false)

  const before = Number(beforeScore) || 0
  // Tease what the "after" could be — shown as a locked range
  const estimatedAfter = Math.min(92, before + 28)
  const keywordsList: string[] = keywords ? JSON.parse(keywords as string) : []

  const handlePay = async () => {
    if (!sessionId) return
    setPaying(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Payment error. Please try again.')
        setPaying(false)
      }
    } catch {
      alert('Network error. Please try again.')
      setPaying(false)
    }
  }

  if (!sessionId) return null

  return (
    <>
      <Head><title>Your ATS Score — CVMatch</title></Head>

      <div style={{ minHeight: '100vh' }}>
        <header style={{ padding: '24px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>CVMatch</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Step 2 of 2 — Review & Pay</span>
        </header>

        <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Here's your ATS score
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
              This is how well your current CV matches the job description
            </p>
          </div>

          {/* Score comparison */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 48, marginBottom: 24, flexWrap: 'wrap',
          }}>
            <ScoreRing score={before} label="Your score now" color="#ff4d6d" />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>→</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>after optimisation</div>
            </div>

            {/* Locked "after" score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', width: 120, height: 120 }}>
                {/* Blurred/locked score ring */}
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,229,192,0.25)"
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(estimatedAfter / 100) * 283} 283`}
                    transform="rotate(-90 50 50)"
                    style={{ filter: 'blur(3px)' }}
                  />
                  <text x="50" y="46" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="20" fontWeight="700" fontFamily="Syne, sans-serif" style={{ filter: 'blur(4px)' }}>
                    {estimatedAfter}
                  </text>
                  <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize="10" fontFamily="Syne, sans-serif">
                    /100
                  </text>
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 24 }}>🔒</span>
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                After (locked)
              </span>
            </div>
          </div>

          {/* Missing keywords */}
          {keywordsList.length > 0 && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '28px', marginBottom: 24,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                Keywords missing from your CV
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                These appear in the job description but not in your CV. Our AI will naturally weave them in.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {keywordsList.map((kw, i) => (
                  <span key={i} style={{
                    padding: '5px 12px',
                    background: 'rgba(255, 77, 109, 0.08)',
                    border: '1px solid rgba(255, 77, 109, 0.25)',
                    borderRadius: 20, fontSize: 13, color: '#ff4d6d',
                    fontFamily: 'DM Mono, monospace',
                  }}>{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* What happens after payment */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '28px', marginBottom: 32,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>What you get</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                'Full CV rewritten by GPT-4o to match this specific job',
                'All missing keywords naturally incorporated',
                'Professional summary rewritten with strong action verbs',
                'ATS-friendly formatting — no tables, no graphics',
                'Plain text download, ready to paste into Word or Google Docs',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(0,229,192,0.1)', border: '1px solid rgba(0,229,192,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: 'var(--accent2)', flexShrink: 0, marginTop: 1,
                  }}>✓</div>
                  <span style={{ fontSize: 15 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,106,255,0.1), rgba(0,229,192,0.05))',
            border: '1px solid rgba(124, 106, 255, 0.3)',
            borderRadius: 16, padding: '32px', textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Get your full optimised CV
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
              Our AI will rewrite it now. Ready to download in ~60 seconds.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
              One-time payment. No subscription. No account needed.
            </p>
            <button
              onClick={handlePay}
              disabled={paying}
              style={{
                padding: '18px 56px',
                background: paying ? 'var(--border)' : 'linear-gradient(135deg, var(--accent), #5b48e8)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif',
                cursor: paying ? 'not-allowed' : 'pointer',
                boxShadow: paying ? 'none' : '0 0 40px rgba(124, 106, 255, 0.4)',
                transition: 'all 0.2s', display: 'block', margin: '0 auto 16px',
              }}
            >
              {paying ? 'Redirecting to payment…' : 'Optimise My CV — £19.99 →'}
            </button>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              🔒 Secure payment via Stripe · VAT included
            </p>
          </div>
        </main>
      </div>
    </>
  )
}

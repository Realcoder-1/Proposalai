import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

declare global {
  interface Window {
    Paddle: any
  }
}

export default function Preview() {
  const router = useRouter()
  const { id, score } = router.query
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paddleReady, setPaddleReady] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Fetch proposal from Supabase
  useEffect(() => {
    if (!id) return
    supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setLoading(false)
          return
        }
        setProposal(data)
        setLoading(false)
      })
  }, [id])

  // Load Paddle Classic JS (v1 — vendors.paddle.com accounts)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (document.getElementById('paddle-js')) {
      // Already loaded — just set vendor and mark ready
      if (window.Paddle) {
        window.Paddle.Setup({ vendor: Number(process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID) })
        setPaddleReady(true)
      }
      return
    }

    const script = document.createElement('script')
    script.id = 'paddle-js'
    // Paddle Classic SDK — NOT v2
    script.src = 'https://cdn.paddle.com/paddle/paddle.js'
    script.async = true
    script.onload = () => {
      // Paddle Classic uses Paddle.Setup, not Paddle.Initialize
      window.Paddle.Setup({
        vendor: Number(process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID),
      })
      setPaddleReady(true)
    }
    script.onerror = () => {
      setCheckoutError('Failed to load payment provider. Please refresh and try again.')
    }
    document.head.appendChild(script)
  }, [])

  const handleCheckout = () => {
    if (!paddleReady) {
      setCheckoutError('Payment provider is still loading. Please wait a moment.')
      return
    }
    if (!proposal) {
      setCheckoutError('Proposal not found. Please go back and try again.')
      return
    }

    setCheckoutError(null)

    // Paddle Classic checkout API
    // passthrough is a string — JSON.stringify the metadata
    window.Paddle.Checkout.open({
      product: Number(process.env.NEXT_PUBLIC_PADDLE_PLAN_ID),
      passthrough: JSON.stringify({ proposalId: id }),
      successCallback: () => {
        // Redirect to result page after successful payment
        router.push(`/result?id=${id}`)
      },
      closeCallback: () => {
        // User closed checkout — no action needed
      },
    })
  }

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingInner}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading your proposal preview…</p>
        </div>
      </div>
    )
  }

  // ── Error state: proposal not found ───────────────────────────
  if (!proposal) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingInner}>
          <p style={{ ...styles.loadingText, color: '#c0392b' }}>
            Proposal not found. Please go back and generate a new one.
          </p>
          <button
            style={{ ...styles.payBtn, marginTop: '1rem', maxWidth: '220px' }}
            onClick={() => router.push('/')}
          >
            ← Back to start
          </button>
        </div>
      </div>
    )
  }

  // ── Scores ─────────────────────────────────────────────────────
  const beforeScore = Number(score) || 22
  const afterScore = Math.min(beforeScore + 52, 94)

  return (
    <>
      <Head>
        <title>Your Proposal Preview — ProposalAI</title>
        <meta name="description" content="See how AI transforms your brief into a client-ready proposal." />
      </Head>

      <div style={styles.page}>
        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoMark}>P</span>
            <span style={styles.logoText}>ProposalAI</span>
          </div>
          <span style={styles.headerTag}>Step 2 of 2 — Unlock your proposal</span>
        </header>

        <main style={styles.main}>
          <div style={styles.twoCol}>

            {/* ── Left: Preview content ── */}
            <div style={styles.left}>
              <h1 style={styles.title}>Your proposal is ready</h1>
              <p style={styles.sub}>
                Here's what your inputs look like right now — and what the AI-optimised version delivers.
                The AI runs the moment your subscription is confirmed.
              </p>

              {/* Score comparison */}
              <div style={styles.scoreCompare}>
                <div style={styles.scoreBox}>
                  <span style={styles.scoreBoxLabel}>Before AI</span>
                  <span style={styles.scoreBoxNum}>{beforeScore}</span>
                  <span style={styles.scoreBoxMax}>/100</span>
                  <div style={styles.scoreMeter}>
                    <div
                      style={{
                        ...styles.scoreMeterFill,
                        width: `${beforeScore}%`,
                        background: 'var(--muted)',
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                  <span style={styles.scoreBoxDesc}>Raw inputs, no polish</span>
                </div>

                <div style={styles.scoreArrow}>→</div>

                <div style={{ ...styles.scoreBox, border: '1px solid var(--gold)' }}>
                  <span style={styles.scoreBoxLabel}>After AI</span>
                  <span style={{ ...styles.scoreBoxNum, color: 'var(--gold)' }}>{afterScore}</span>
                  <span style={styles.scoreBoxMax}>/100</span>
                  <div style={styles.scoreMeter}>
                    <div
                      style={{
                        ...styles.scoreMeterFill,
                        width: `${afterScore}%`,
                        background: 'var(--gold)',
                        transition: 'width 0.8s ease 0.3s',
                      }}
                    />
                  </div>
                  <span style={styles.scoreBoxDesc}>Polished, client-ready</span>
                </div>
              </div>

              {/* Blurred proposal preview */}
              <div style={styles.previewCard}>
                <div style={styles.previewHeader}>
                  <span style={styles.previewLabel}>Proposal preview</span>
                  <span style={styles.lockedBadge}>🔒 Locked</span>
                </div>

                {/* Simulated proposal structure — blurred lines */}
                <div style={styles.previewLines}>
                  {/* "Heading" line */}
                  <div style={{ ...styles.blurLine, width: '55%', height: '16px', marginBottom: '14px', background: '#d0cec9' }} />
                  {/* Paragraph lines */}
                  {[95, 88, 92, 70, 85, 78, 90, 60, 82, 75].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.blurLine,
                        width: `${w}%`,
                        opacity: Math.max(0.15, 1 - i * 0.08),
                      }}
                    />
                  ))}
                  <div style={styles.blurOverlay} />
                </div>

                <p style={styles.previewNote}>
                  Unlock to see your full, client-ready proposal
                </p>
              </div>

              {/* What's included */}
              <ul style={styles.benefits}>
                {[
                  'Proposal tailored to the exact client brief',
                  'Professional tone — confident, no filler',
                  'Clear scope, timeline & pricing section',
                  'Download as plain text — paste anywhere',
                  'Unlimited proposals included at £29/month',
                  'New industry templates added monthly',
                ].map((b, i) => (
                  <li key={i} style={styles.benefit}>
                    <span style={styles.tick}>✓</span> {b}
                  </li>
                ))}
              </ul>

              {/* Brief summary (so they remember what they submitted) */}
              {proposal?.brief && (
                <div style={styles.briefSummary}>
                  <span style={styles.briefLabel}>Your brief summary</span>
                  <p style={styles.briefText}>
                    {proposal.brief.length > 200
                      ? proposal.brief.slice(0, 200) + '…'
                      : proposal.brief}
                  </p>
                </div>
              )}
            </div>

            {/* ── Right: CTA card ── */}
            <div style={styles.right}>
              <div style={styles.ctaCard}>
                <p style={styles.ctaEyebrow}>Unlock your proposal</p>
                <div style={styles.price}>
                  <span style={styles.priceAmount}>£29</span>
                  <span style={styles.pricePer}>/month</span>
                </div>
                <p style={styles.priceSub}>Cancel anytime · Unlimited proposals</p>

                <div style={styles.divider} />

                <ul style={styles.ctaList}>
                  {[
                    'This proposal generated immediately',
                    'All future proposals included',
                    'Proposal history saved to your account',
                    'VAT handled automatically by Paddle',
                  ].map((item, i) => (
                    <li key={i} style={styles.ctaListItem}>
                      <span style={styles.ctaCheck}>✓</span> {item}
                    </li>
                  ))}
                </ul>

                {checkoutError && (
                  <div style={styles.errorBox}>
                    {checkoutError}
                  </div>
                )}

                <button
                  style={{
                    ...styles.payBtn,
                    opacity: paddleReady ? 1 : 0.6,
                    cursor: paddleReady ? 'pointer' : 'not-allowed',
                  }}
                  onClick={handleCheckout}
                  disabled={!paddleReady}
                >
                  {paddleReady ? 'Unlock with Paddle →' : 'Loading payment…'}
                </button>

                <p style={styles.secure}>
                  🔒 Secure payment via Paddle · No card stored by us
                </p>

                <div style={styles.guarantee}>
                  <strong style={{ color: 'var(--gold)' }}>AI only runs after payment.</strong>
                  {' '}Your brief is saved — the moment your subscription is confirmed,
                  your proposal generates automatically. Takes under 30 seconds.
                </div>
              </div>

              {/* Trust signals below card */}
              <div style={styles.trustRow}>
                <span style={styles.trustItem}>🇬🇧 UK-based</span>
                <span style={styles.trustItem}>💳 Paddle MoR</span>
                <span style={styles.trustItem}>🔁 Cancel anytime</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'var(--paper)',
    fontFamily: 'DM Sans, sans-serif',
  },
  loadingInner: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
  },
  spinner: {
    width: '32px', height: '32px',
    border: '3px solid var(--border)',
    borderTopColor: 'var(--ink)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: 'var(--muted)', fontSize: '0.92rem' },

  page: { minHeight: '100vh', background: 'var(--paper)' },

  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 2rem',
    borderBottom: '1px solid var(--border)',
    background: 'var(--white)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  logoMark: {
    width: '32px', height: '32px',
    background: 'var(--ink)', color: 'var(--gold)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem',
    borderRadius: '4px',
  },
  logoText: {
    fontFamily: 'Playfair Display, serif', fontWeight: 700,
    fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--ink)',
  },
  headerTag: {
    fontSize: '0.78rem', color: 'var(--muted)',
    fontFamily: 'DM Mono, monospace',
  },

  main: { maxWidth: '1020px', margin: '0 auto', padding: '3rem 2rem 5rem' },

  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '3rem',
    alignItems: 'start',
  },

  left: {},

  title: {
    fontFamily: 'Playfair Display, serif',
    fontSize: '2rem', fontWeight: 700,
    marginBottom: '0.75rem', color: 'var(--ink)',
  },
  sub: {
    color: 'var(--muted)', marginBottom: '2rem',
    lineHeight: 1.65, fontSize: '0.95rem',
  },

  scoreCompare: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    marginBottom: '2rem', flexWrap: 'wrap',
  },
  scoreBox: {
    flex: 1, minWidth: '130px',
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '1.2rem',
    display: 'flex', flexDirection: 'column', gap: '0.3rem',
  },
  scoreBoxLabel: {
    fontSize: '0.72rem', color: 'var(--muted)',
    fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  scoreBoxNum: {
    fontSize: '2.2rem', fontWeight: 700,
    fontFamily: 'Playfair Display, serif', lineHeight: 1,
    color: 'var(--ink)',
  },
  scoreBoxMax: { fontSize: '0.8rem', color: 'var(--muted)' },
  scoreMeter: {
    height: '4px', background: 'var(--border)',
    borderRadius: '2px', overflow: 'hidden', marginTop: '0.25rem',
  },
  scoreMeterFill: { height: '100%', borderRadius: '2px' },
  scoreBoxDesc: { fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.15rem' },
  scoreArrow: { fontSize: '1.5rem', color: 'var(--border)', flexShrink: 0 },

  previewCard: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '1.5rem',
    marginBottom: '2rem',
    position: 'relative',
    overflow: 'hidden',
  },
  previewHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '1.25rem',
  },
  previewLabel: {
    fontSize: '0.8rem', fontFamily: 'DM Mono, monospace',
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  lockedBadge: {
    fontSize: '0.73rem',
    background: 'var(--cream)',
    padding: '0.25rem 0.7rem',
    borderRadius: '20px',
    border: '1px solid var(--border)',
    color: 'var(--muted)',
  },
  previewLines: { position: 'relative', minHeight: '140px' },
  blurLine: {
    height: '11px',
    background: '#e8e5df',
    borderRadius: '6px',
    marginBottom: '10px',
    filter: 'blur(1px)',
  },
  blurOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '90px',
    background: 'linear-gradient(to bottom, transparent, var(--white))',
    pointerEvents: 'none',
  },
  previewNote: {
    textAlign: 'center',
    fontSize: '0.8rem',
    color: 'var(--muted)',
    marginTop: '0.75rem',
    fontFamily: 'DM Mono, monospace',
  },

  benefits: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column', gap: '0.65rem',
    marginBottom: '2rem',
  },
  benefit: { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.92rem', color: 'var(--ink)' },
  tick: { color: '#4a7c59', fontWeight: 700, flexShrink: 0, marginTop: '0.05rem' },

  briefSummary: {
    background: 'var(--cream)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1rem 1.25rem',
  },
  briefLabel: {
    display: 'block',
    fontSize: '0.72rem', fontFamily: 'DM Mono, monospace',
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: '0.5rem',
  },
  briefText: {
    fontSize: '0.88rem', color: 'var(--ink)',
    lineHeight: 1.55, margin: 0,
  },

  // ── Right column ──
  right: { position: 'sticky', top: '2rem' },

  ctaCard: {
    background: 'var(--ink)',
    color: 'var(--paper)',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  },
  ctaEyebrow: {
    fontFamily: 'DM Mono, monospace',
    fontSize: '0.72rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--gold)',
    marginBottom: '0.75rem',
  },
  price: { display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginBottom: '0.3rem' },
  priceAmount: {
    fontFamily: 'Playfair Display, serif',
    fontSize: '3.2rem', fontWeight: 700,
    color: 'var(--white)', lineHeight: 1,
  },
  pricePer: { fontSize: '1rem', color: '#888' },
  priceSub: { fontSize: '0.78rem', color: '#777', marginBottom: '1.5rem' },

  divider: { height: '1px', background: '#222', marginBottom: '1.5rem' },

  ctaList: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column', gap: '0.6rem',
    marginBottom: '1.75rem',
  },
  ctaListItem: {
    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
    fontSize: '0.85rem', color: '#bbb', lineHeight: 1.45,
  },
  ctaCheck: { color: 'var(--gold)', flexShrink: 0, fontWeight: 700, marginTop: '0.05rem' },

  errorBox: {
    background: '#2a1010',
    border: '1px solid #5c2020',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    fontSize: '0.8rem',
    color: '#e07070',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },

  payBtn: {
    width: '100%',
    padding: '1rem',
    background: 'var(--gold)',
    color: 'var(--ink)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    fontFamily: 'DM Sans, sans-serif',
    cursor: 'pointer',
    marginBottom: '1rem',
    transition: 'opacity 0.2s',
    letterSpacing: '-0.01em',
  },
  secure: {
    fontSize: '0.73rem', color: '#555',
    textAlign: 'center' as const, marginBottom: '1rem',
  },
  guarantee: {
    background: '#111',
    borderRadius: '8px',
    padding: '1rem',
    fontSize: '0.78rem',
    color: '#888',
    lineHeight: 1.6,
  },

  trustRow: {
    display: 'flex', justifyContent: 'center', gap: '1rem',
    marginTop: '1rem', flexWrap: 'wrap',
  },
  trustItem: {
    fontSize: '0.73rem', color: 'var(--muted)',
    fontFamily: 'DM Mono, monospace',
  },
}

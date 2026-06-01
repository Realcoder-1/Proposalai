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

  useEffect(() => {
    if (!id) return
    supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProposal(data)
        setLoading(false)
      })
  }, [id])

  // Load Paddle.js
  useEffect(() => {
    if (typeof window === 'undefined') return
    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.onload = () => {
      window.Paddle.Environment.set('production')
      window.Paddle.Initialize({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      })
      setPaddleReady(true)
    }
    document.head.appendChild(script)
  }, [])

  const handleCheckout = () => {
    if (!paddleReady || !proposal) return
    window.Paddle.Checkout.open({
      items: [{ priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID, quantity: 1 }],
      customData: { proposalId: id },
      successUrl: `${window.location.origin}/result?id=${id}`,
    })
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading preview…</p>
      </div>
    )
  }

  const beforeScore = Number(score) || 22
  const afterScore = Math.min(beforeScore + 52, 94)

  return (
    <>
      <Head>
        <title>Your Proposal Preview — ProposalAI</title>
      </Head>

      <div style={styles.page}>
        <header style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoMark}>P</span>
            <span style={styles.logoText}>ProposalAI</span>
          </div>
        </header>

        <main style={styles.main}>
          <div style={styles.twoCol}>
            {/* Left: preview */}
            <div style={styles.left}>
              <h1 style={styles.title}>Your proposal is ready</h1>
              <p style={styles.sub}>
                Here's what your inputs look like right now — and what the AI-optimised version delivers.
              </p>

              <div style={styles.scoreCompare}>
                <div style={styles.scoreBox}>
                  <span style={styles.scoreBoxLabel}>Before AI</span>
                  <span style={styles.scoreBoxNum}>{beforeScore}</span>
                  <span style={styles.scoreBoxMax}>/100</span>
                  <div style={styles.scoreMeter}>
                    <div style={{ ...styles.scoreMeterFill, width: `${beforeScore}%`, background: 'var(--muted)' }} />
                  </div>
                  <span style={styles.scoreBoxDesc}>Raw inputs, no polish</span>
                </div>
                <div style={styles.scoreArrow}>→</div>
                <div style={{ ...styles.scoreBox, border: '1px solid var(--gold)' }}>
                  <span style={styles.scoreBoxLabel}>After AI</span>
                  <span style={{ ...styles.scoreBoxNum, color: 'var(--gold)' }}>{afterScore}</span>
                  <span style={styles.scoreBoxMax}>/100</span>
                  <div style={styles.scoreMeter}>
                    <div style={{ ...styles.scoreMeterFill, width: `${afterScore}%`, background: 'var(--gold)' }} />
                  </div>
                  <span style={styles.scoreBoxDesc}>Polished, client-ready</span>
                </div>
              </div>

              <div style={styles.previewCard}>
                <div style={styles.previewHeader}>
                  <span style={styles.previewLabel}>Proposal preview</span>
                  <span style={styles.lockedBadge}>🔒 Locked</span>
                </div>
                <div style={styles.previewLines}>
                  {[80, 95, 70, 88, 60, 75, 90, 65].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.blurLine,
                        width: `${w}%`,
                        opacity: 1 - i * 0.1,
                      }}
                    />
                  ))}
                  <div style={styles.blurOverlay} />
                </div>
                <p style={styles.previewNote}>
                  Unlock to see your full, client-ready proposal
                </p>
              </div>

              <ul style={styles.benefits}>
                {[
                  'Tailored to the exact client brief',
                  'Professional tone, no filler',
                  'Clear pricing section included',
                  'Download as plain text — paste anywhere',
                  'Unlimited proposals, £29/month',
                ].map((b, i) => (
                  <li key={i} style={styles.benefit}>
                    <span style={styles.tick}>✓</span> {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: CTA */}
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
                  <li>This proposal + all future ones</li>
                  <li>Proposal history saved</li>
                  <li>New industry templates monthly</li>
                </ul>

                <button style={styles.payBtn} onClick={handleCheckout}>
                  Unlock with Paddle →
                </button>

                <p style={styles.secure}>
                  🔒 Secure payment via Paddle · VAT handled automatically
                </p>

                <div style={styles.guarantee}>
                  <strong>AI only runs after payment.</strong> Your inputs are saved — the moment your subscription is confirmed, your proposal is generated automatically.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'var(--paper)',
    fontFamily: 'DM Sans, sans-serif', color: 'var(--muted)',
  },
  page: { minHeight: '100vh', background: 'var(--paper)' },
  header: {
    display: 'flex', alignItems: 'center',
    padding: '1.5rem 2rem',
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
    fontSize: '1.15rem', letterSpacing: '-0.02em',
  },
  main: { maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem 4rem' },
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
    marginBottom: '0.75rem',
  },
  sub: { color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.6 },
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
  scoreBoxLabel: { fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'DM Mono, monospace' },
  scoreBoxNum: { fontSize: '2rem', fontWeight: 700, fontFamily: 'Playfair Display, serif', lineHeight: 1 },
  scoreBoxMax: { fontSize: '0.8rem', color: 'var(--muted)' },
  scoreMeter: {
    height: '4px', background: 'var(--border)',
    borderRadius: '2px', overflow: 'hidden', marginTop: '0.25rem',
  },
  scoreMeterFill: { height: '100%', borderRadius: '2px' },
  scoreBoxDesc: { fontSize: '0.72rem', color: 'var(--muted)' },
  scoreArrow: { fontSize: '1.5rem', color: 'var(--border)' },
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
    alignItems: 'center', marginBottom: '1rem',
  },
  previewLabel: { fontSize: '0.82rem', fontFamily: 'DM Mono, monospace', color: 'var(--muted)' },
  lockedBadge: {
    fontSize: '0.75rem',
    background: 'var(--cream)',
    padding: '0.2rem 0.6rem',
    borderRadius: '20px',
    border: '1px solid var(--border)',
  },
  previewLines: { position: 'relative' },
  blurLine: {
    height: '12px',
    background: 'var(--cream)',
    borderRadius: '6px',
    marginBottom: '10px',
  },
  blurOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '80px',
    background: 'linear-gradient(to bottom, transparent, var(--white))',
  },
  previewNote: {
    textAlign: 'center',
    fontSize: '0.82rem',
    color: 'var(--muted)',
    marginTop: '0.5rem',
    fontFamily: 'DM Mono, monospace',
  },
  benefits: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  benefit: { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.92rem' },
  tick: { color: 'var(--sage)', fontWeight: 700, flexShrink: 0 },
  right: { position: 'sticky', top: '2rem' },
  ctaCard: {
    background: 'var(--ink)',
    color: 'var(--paper)',
    borderRadius: '12px',
    padding: '2rem',
  },
  ctaEyebrow: {
    fontFamily: 'DM Mono, monospace',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--gold)',
    marginBottom: '0.75rem',
  },
  price: { display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginBottom: '0.3rem' },
  priceAmount: {
    fontFamily: 'Playfair Display, serif',
    fontSize: '3rem', fontWeight: 700,
    color: 'var(--white)',
  },
  pricePer: { fontSize: '1rem', color: '#888' },
  priceSub: { fontSize: '0.8rem', color: '#888', marginBottom: '1.5rem' },
  divider: { height: '1px', background: '#222', marginBottom: '1.5rem' },
  ctaList: {
    listStyle: 'none',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
    marginBottom: '1.5rem',
    fontSize: '0.88rem',
    color: '#bbb',
  },
  payBtn: {
    width: '100%',
    padding: '1rem',
    background: 'var(--gold)',
    color: 'var(--ink)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 500,
    fontFamily: 'DM Sans, sans-serif',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  secure: { fontSize: '0.75rem', color: '#666', textAlign: 'center', marginBottom: '1rem' },
  guarantee: {
    background: '#111',
    borderRadius: '8px',
    padding: '1rem',
    fontSize: '0.78rem',
    color: '#999',
    lineHeight: 1.5,
  },
}

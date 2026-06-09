import { useRouter } from 'next/router'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import ScoreRing from '@/components/ScoreRing'

type Status = 'loading' | 'processing' | 'ready' | 'error'

export default function Result() {
  const router = useRouter()
  const { session_id, status } = router.query

  const [data, setData] = useState<any>(null)
  const [pageStatus, setPageStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!session_id || status !== 'success') return

    let cancelled = false

    const poll = async () => {
      if (cancelled) return

      const res = await fetch(`/api/result?sessionId=${session_id}`)

      if (res.status === 200) {
        const d = await res.json()
        if (!cancelled) {
          setData(d)
          setPageStatus('ready')
        }
        return
      }

      if (res.status === 202) {
        // Still processing — AI running in webhook, keep polling
        if (!cancelled) setPageStatus('processing')
        setTimeout(poll, 2000)
        return
      }

      if (res.status === 403) {
        // Payment webhook not hit yet — wait a bit longer
        if (!cancelled) setPageStatus('loading')
        setTimeout(poll, 1500)
        return
      }

      // Actual error
      if (!cancelled) {
        setErrorMsg('Could not load your CV. Please contact support.')
        setPageStatus('error')
      }
    }

    poll()
    return () => { cancelled = true }
  }, [session_id, status])

  const handleCopy = () => {
    if (!data?.optimizedCV) return
    navigator.clipboard.writeText(data.optimizedCV)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!data?.optimizedCV) return
    const blob = new Blob([data.optimizedCV], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimised-cv.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (status !== 'success') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Payment cancelled</h1>
        <p style={{ color: 'var(--text-muted)' }}>No charge was made.</p>
        <button onClick={() => router.push('/')} style={{ padding: '12px 24px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
          Start over
        </button>
      </div>
    )
  }

  const loadingMessages: Record<Status, { title: string; sub: string }> = {
    loading: { title: 'Confirming payment…', sub: 'Checking with Stripe' },
    processing: { title: 'Rewriting your CV…', sub: 'GPT-4o is working — takes about 30–60 seconds' },
    ready: { title: 'Ready', sub: '' },
    error: { title: 'Error', sub: errorMsg },
  }

  return (
    <>
      <Head><title>Your Optimised CV — CVMatch</title></Head>

      <div style={{ minHeight: '100vh' }}>
        <header style={{ padding: '24px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>CVMatch</span>
          </div>
          <div style={{ padding: '6px 14px', background: 'rgba(0,229,192,0.1)', border: '1px solid rgba(0,229,192,0.3)', borderRadius: 20, fontSize: 13, color: 'var(--accent2)', fontFamily: 'DM Mono, monospace' }}>
            ✓ Payment confirmed
          </div>
        </header>

        <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>

          {pageStatus !== 'ready' && pageStatus !== 'error' && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{loadingMessages[pageStatus].title}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{loadingMessages[pageStatus].sub}</p>
              {pageStatus === 'processing' && (
                <div style={{ marginTop: 24, padding: '12px 20px', background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 10, display: 'inline-block' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Don't close this tab — your CV is being rewritten now
                  </p>
                </div>
              )}
            </div>
          )}

          {pageStatus === 'error' && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <p style={{ color: '#ff4d6d', marginBottom: 16 }}>{errorMsg}</p>
              <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>Refresh</button>
            </div>
          )}

          {pageStatus === 'ready' && data && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  Your optimised CV is ready
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Copy it or download as a text file, then paste into Word or Google Docs.</p>
              </div>

              {/* Score */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px', display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 24, flexWrap: 'wrap' }}>
                <ScoreRing score={data.beforeScore} label="Before" color="#ff4d6d" />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ fontSize: 28 }}>→</div>
                  <div style={{ padding: '4px 12px', background: 'rgba(0,229,192,0.1)', border: '1px solid rgba(0,229,192,0.3)', borderRadius: 20, fontSize: 13, color: 'var(--accent2)', fontFamily: 'DM Mono, monospace' }}>
                    +{data.afterScore - data.beforeScore} pts
                  </div>
                </div>
                <ScoreRing score={data.afterScore} label="After" color="#00e5c0" />
              </div>

              {/* Improvements */}
              {data.improvements?.length > 0 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>What we changed</h2>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {data.improvements.map((item: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,229,192,0.1)', border: '1px solid rgba(0,229,192,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--accent2)', flexShrink: 0, marginTop: 1 }}>✓</div>
                        <span style={{ fontSize: 15 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={handleDownload} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, var(--accent), #5b48e8)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer', boxShadow: '0 0 24px rgba(124,106,255,0.3)' }}>
                  ↓ Download .txt
                </button>
                <button onClick={handleCopy} style={{ padding: '14px 32px', background: 'var(--surface)', color: copied ? 'var(--accent2)' : 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: 'Syne, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {copied ? '✓ Copied!' : '⎘ Copy to clipboard'}
                </button>
              </div>

              {/* The CV */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Your Optimised CV
                </h2>
                <pre style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 600, overflowY: 'auto', padding: '16px', background: 'var(--surface2)', borderRadius: 8 }}>
                  {data.optimizedCV}
                </pre>
              </div>

              <div style={{ padding: '16px 20px', background: 'rgba(124,106,255,0.05)', border: '1px solid rgba(124,106,255,0.15)', borderRadius: 10, fontSize: 14, color: 'var(--text-muted)' }}>
                💡 <strong style={{ color: 'var(--text)' }}>Tip:</strong> Paste this into Google Docs or Microsoft Word, apply your preferred formatting, and save as PDF before submitting.
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}

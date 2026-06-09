import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function ResultPage() {
  const router = useRouter()
  const { session_id } = router.query
  const [status, setStatus] = useState<'loading' | 'processing' | 'done' | 'error'>('loading')
  const [proposal, setProposal] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!session_id) return

    let attempts = 0
    const maxAttempts = 30 // 60 seconds

    const poll = async () => {
      try {
        const res = await fetch(`/api/result?sessionId=${session_id}`)
        const data = await res.json()

        if (res.ok && data.proposal) {
          setProposal(data.proposal)
          setWordCount(data.wordCount)
          setStatus('done')
          return
        }

        if (data.status === 'processing' || data.status === 'unpaid') {
          setStatus('processing')
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000)
          } else {
            setStatus('error')
          }
          return
        }

        setStatus('error')
      } catch {
        setStatus('error')
      }
    }

    poll()
  }, [session_id])

  const copy = () => {
    navigator.clipboard.writeText(proposal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    const blob = new Blob([proposal], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'proposal.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Head>
        <title>Your Proposal — ProposalAI</title>
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          padding: '20px 40px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => router.push('/')}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>ProposalAI</span>
          </div>
        </header>

        <main style={{ flex: 1, maxWidth: 780, margin: '0 auto', padding: '56px 24px', width: '100%' }}>

          {(status === 'loading' || status === 'processing') && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div style={{
                width: 48, height: 48, border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 24px',
              }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
                Writing your proposal…
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
                Payment confirmed. Give us about 30–60 seconds.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>⚠️</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Something went wrong</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
                Your payment went through — email us at <strong>hello@proposalai.co.uk</strong> and we'll sort it immediately.
              </p>
              <button onClick={() => router.push('/')} style={{
                padding: '12px 28px', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: 8,
                color: 'var(--text)', fontFamily: 'Syne, sans-serif', cursor: 'pointer', fontSize: 14,
              }}>← Back to home</button>
            </div>
          )}

          {status === 'done' && (
            <div className="fade-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                  <div style={{
                    display: 'inline-block', padding: '4px 12px',
                    background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)',
                    borderRadius: 20, fontSize: 11, color: 'var(--success)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    marginBottom: 10, fontFamily: 'DM Mono, monospace',
                  }}>✓ Ready</div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Your proposal</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
                    {wordCount} words
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={copy} style={{
                    padding: '10px 20px', background: copied ? 'rgba(34,211,238,0.1)' : 'var(--surface2)',
                    border: `1px solid ${copied ? 'rgba(34,211,238,0.4)' : 'var(--border)'}`,
                    borderRadius: 8, color: copied ? 'var(--success)' : 'var(--text)',
                    fontFamily: 'Syne, sans-serif', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    transition: 'all 0.2s',
                  }}>
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button onClick={download} style={{
                    padding: '10px 20px', background: 'var(--surface2)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text)', fontFamily: 'Syne, sans-serif',
                    cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  }}>
                    ⬇ Download
                  </button>
                </div>
              </div>

              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '36px',
                fontFamily: 'DM Mono, monospace', fontSize: 14, lineHeight: 1.8,
                color: 'var(--text)', whiteSpace: 'pre-wrap',
              }}>
                {proposal}
              </div>

              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button onClick={() => router.push('/')} style={{
                  padding: '12px 28px', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--text-muted)', fontFamily: 'Syne, sans-serif',
                  cursor: 'pointer', fontSize: 14,
                }}>Generate another proposal →</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

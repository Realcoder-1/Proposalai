import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'

// ─── Client-side keyword scorer — zero API cost ───────────────────────────
function scoreCV(cv: string, jobDescription: string): { score: number; keywords: string[] } {
  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as','is','was','are','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','shall','can','need','dare','ought','used','able'])

  const extractKeywords = (text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w))
  }

  const jobWords = extractKeywords(jobDescription)
  const cvWords = new Set(extractKeywords(cv))

  // Count unique job keywords found in CV
  const uniqueJobWords = [...new Set(jobWords)]
  const matched = uniqueJobWords.filter(w => cvWords.has(w))

  const score = Math.min(75, Math.round((matched.length / Math.max(uniqueJobWords.length, 1)) * 100))

  // Return top 8 unmatched keywords as the ones "missing"
  const missing = uniqueJobWords
    .filter(w => !cvWords.has(w))
    .slice(0, 8)

  return { score: Math.max(score, 15), keywords: missing }
}
// ─────────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter()
  const [cv, setCv] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!cv.trim() || !jobDescription.trim()) {
      setError('Please paste both your CV and the job description.')
      return
    }
    if (cv.length < 100) { setError('CV seems too short — paste your full CV.'); return }
    if (jobDescription.length < 50) { setError('Job description seems too short.'); return }

    setError('')
    setLoading(true)

    try {
      // 1. Score client-side — FREE, no API call
      const { score: beforeScore, keywords } = scoreCV(cv, jobDescription)

      // 2. Save raw data to Supabase — just storage, no AI yet
      const sessionId = crypto.randomUUID()
      const { error: dbError } = await supabase.from('cv_sessions').insert({
        session_id: sessionId,
        original_cv: cv,
        job_description: jobDescription,
        before_score: beforeScore,
        keywords: keywords,
        payment_status: 'pending',
      })

      if (dbError) {
        console.error('DB error:', dbError)
        setError('Failed to save session. Please try again.')
        setLoading(false)
        return
      }

      // 3. Go to preview — no GPT called yet
      router.push({
        pathname: '/preview',
        query: {
          sessionId,
          beforeScore,
          keywords: JSON.stringify(keywords),
        },
      })
    } catch (e) {
      console.error(e)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>CVMatch — Land More Interviews</title>
        <meta name="description" content="Paste your CV and a job description. Get an ATS-optimised CV in 60 seconds. £19.99 one-time." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          padding: '24px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
            }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>CVMatch</span>
          </div>
          <div style={{
            padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 20,
            fontSize: 13, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace',
          }}>
            £19.99 · one-time
          </div>
        </header>

        <main style={{ flex: 1, maxWidth: 900, margin: '0 auto', padding: '60px 24px', width: '100%' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block', padding: '4px 14px',
              background: 'rgba(124, 106, 255, 0.1)', border: '1px solid rgba(124, 106, 255, 0.3)',
              borderRadius: 20, fontSize: 12, color: 'var(--accent)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20,
              fontFamily: 'DM Mono, monospace',
            }}>
              ATS Optimisation · Instant Score
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800,
              lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16,
            }}>
              Your CV isn't failing.<br />
              <span style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>The ATS is rejecting it.</span>
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto' }}>
              Paste your CV and the job description. See your ATS match score instantly — free. Pay once to get the full AI-rewritten version.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
            {[
              { value: '75%', label: 'of CVs rejected by ATS before a human sees them' },
              { value: 'Free', label: 'to see your before score — no card needed' },
              { value: '£19.99', label: 'one-time to get the full rewritten CV' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '20px 24px', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent2)', letterSpacing: '-0.02em' }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Input form */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '32px', marginBottom: 24,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {[
                { label: 'Your Current CV', value: cv, setter: setCv, placeholder: 'Paste your full CV here — plain text is fine. Include all sections: experience, skills, education…', accent: 'var(--accent)' },
                { label: 'Job Description', value: jobDescription, setter: setJobDescription, placeholder: 'Paste the full job description — including requirements, responsibilities, and any skills listed…', accent: 'var(--accent2)' },
              ].map(({ label, value, setter, placeholder, accent }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {label}
                  </label>
                  <textarea
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: '100%', height: 280, background: 'var(--surface2)',
                      border: '1px solid var(--border)', borderRadius: 10,
                      padding: '14px 16px', color: 'var(--text)',
                      fontFamily: 'DM Mono, monospace', fontSize: 13,
                      resize: 'vertical', outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = accent}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{value.length} characters</div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{
                marginTop: 16, padding: '12px 16px',
                background: 'rgba(255, 77, 109, 0.1)', border: '1px solid rgba(255, 77, 109, 0.3)',
                borderRadius: 8, color: '#ff4d6d', fontSize: 14,
              }}>{error}</div>
            )}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '16px 48px',
                  background: loading ? 'var(--border)' : 'linear-gradient(135deg, var(--accent), #5b48e8)',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif',
                  cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 0 30px rgba(124, 106, 255, 0.4)',
                }}
              >
                {loading ? 'Scoring…' : 'See My ATS Score →'}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
              Free instant score · Pay £19.99 only if you want the full rewritten CV
            </p>
          </div>

          {/* Trust */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['🔒 Secure · Stripe payments', '⚡ Score in under a second', '📄 Download as plain text', '🇬🇧 UK English · VAT included'].map((item, i) => (
              <span key={i} style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item}</span>
            ))}
          </div>
        </main>
      </div>
    </>
  )
}

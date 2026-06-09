import { useEffect, useRef } from 'react'

interface ScoreRingProps {
  score: number
  label: string
  color: string
  size?: number
}

export default function ScoreRing({ score, label, color, size = 120 }: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
      circleRef.current.style.strokeDashoffset = String(offset)
    }
  }, [offset])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          ref={circleRef}
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          transform="rotate(-90 50 50)"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x="50" y="46" textAnchor="middle" fill={color} fontSize="20" fontWeight="700" fontFamily="Syne, sans-serif">
          {score}
        </text>
        <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="Syne, sans-serif">
          /100
        </text>
      </svg>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

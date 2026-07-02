'use client'
import { useEffect, useRef, useState } from 'react'

/** Número que se anima desde 0 hasta el valor al montar/cambiar. */
export function CountUp({ value, duration = 900, suffix = '' }: { value: number; duration?: number; suffix?: string }) {
  const [n, setN] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const desde = from.current
    const hasta = value
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setN(Math.round(desde + (hasta - desde) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = hasta
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <>{n.toLocaleString('es-ES')}{suffix}</>
}

type Seg = { label: string; value: number; color: string }

/** Gráfica de dona (SVG) con leyenda, animada. */
export function Donut({ segments, size = 150, stroke = 20 }: { segments: Seg[]; size?: number; stroke?: number }) {
  const [shown, setShown] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShown(true), 60); return () => clearTimeout(t) }, [])

  const total = segments.reduce((s, x) => s + x.value, 0)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f4f1" strokeWidth={stroke} />
        {total > 0 && segments.map((s, i) => {
          const frac = s.value / total
          const len = shown ? c * frac : 0
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-(shown ? offset : 0)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1), stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
          )
          offset += c * frac
          return el
        })}
        <text x="50%" y="47%" textAnchor="middle" fontSize="30" fontWeight="800" fill="#16201d">{total}</text>
        <text x="50%" y="61%" textAnchor="middle" fontSize="11.5" fill="#9aaba5" fontWeight="600">leads</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 120 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#48574f', fontWeight: 500, flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 13.5, color: '#16201d', fontWeight: 700 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

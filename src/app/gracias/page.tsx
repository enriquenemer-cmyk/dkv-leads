'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Phone, Mail, Clock, CheckCircle2, ArrowLeft } from 'lucide-react'

const PASOS = [
  { icon: Phone, num: '01', titulo: 'Te llamamos hoy', texto: 'Un asesor personal te contactará antes de las 24h. Revisa tu teléfono.' },
  { icon: Mail, num: '02', titulo: 'Recibes información', texto: 'Te enviamos un resumen con las opciones que mejor se adaptan a ti.' },
  { icon: Clock, num: '03', titulo: 'Eliges sin prisa', texto: 'Sin presiones. Tienes tiempo para decidir. Nosotros estamos aquí.' },
]

function GraciasContent() {
  const nombre = useSearchParams().get('nombre') ?? 'cliente'
  return (
    <main style={{ minHeight: '100vh', background: '#f0f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, color: '#fff' }}>+</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19, color: '#16201d', lineHeight: 1 }}>DKV</div>
            <div style={{ fontSize: 11, color: '#6b7a76', fontWeight: 500 }}>Seguros de salud</div>
          </div>
        </div>

        {/* Check circle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #0F7A63, #1a9e7e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px -10px rgba(15,122,99,0.45)' }}>
            <CheckCircle2 size={44} color="#fff" strokeWidth={2} />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#16201d', margin: '0 0 10px', letterSpacing: '-0.025em' }}>¡Gracias, {nombre}!</h1>
          <p style={{ fontSize: 16, color: '#6b7a76', margin: 0, lineHeight: 1.6 }}>Tu solicitud llegó perfectamente. Aquí tienes lo que pasa ahora.</p>
        </div>

        {/* Steps */}
        <div style={{ background: '#fff', borderRadius: 22, padding: '28px', border: '1px solid #eaeeed', marginBottom: 24, boxShadow: '0 8px 30px -8px rgba(10,47,39,0.08)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {PASOS.map(({ icon: Icon, num, titulo, texto }, i) => (
              <div key={num} style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} color="#fff" />
                  </div>
                  {i < PASOS.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 20, background: '#e6eae8', margin: '6px 0' }} />}
                </div>
                <div style={{ paddingTop: 8, paddingBottom: i < PASOS.length - 1 ? 8 : 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#16201d', marginBottom: 3 }}>{titulo}</div>
                  <div style={{ fontSize: 13.5, color: '#6b7a76', lineHeight: 1.55 }}>{texto}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Link href="/"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px', borderRadius: 14, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={14} /> Volver al inicio
          </Link>
          <Link href="/panel/login"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #0F7A63, #0a5b49)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, boxShadow: '0 6px 20px -6px rgba(15,122,99,0.45)' }}>
            Panel del asesor →
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function GraciasPage() {
  return <Suspense><GraciasContent /></Suspense>
}

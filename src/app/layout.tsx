import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'DKV Seguros – Asesoría de salud sin compromiso',
  description: 'Solicita asesoría gratuita en seguros de salud DKV. Asesor personal, respuesta en menos de 24h. Sin listas de espera, sin permanencia mínima.',
  keywords: ['seguro de salud', 'DKV', 'seguro médico', 'asesor salud', 'seguro familiar'],
  authors: [{ name: 'DKV Seguros' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'DKV Seguros – Tu salud merece la mejor cobertura',
    description: 'Compara los mejores planes DKV. Un asesor personal sin coste, respuesta garantizada en menos de 24h.',
    type: 'website',
    locale: 'es_ES',
    siteName: 'DKV Seguros',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DKV Seguros – Asesoría gratuita de salud',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DKV Seguros – Tu salud merece la mejor cobertura',
    description: 'Compara los mejores planes DKV. Un asesor personal sin coste, respuesta en menos de 24h.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${font.variable} font-sans antialiased`} style={{ background: '#f1f4f2' }}>
        {children}
      </body>
    </html>
  )
}

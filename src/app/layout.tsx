import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Analytics from '@/components/Analytics'
import { Analytics as VercelAnalytics } from '@vercel/analytics/next'
import WebTracker from '@/components/WebTracker'

export const viewport: Viewport = {
  themeColor: '#0F7A63',
  width: 'device-width',
  initialScale: 1,
}

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://dkv-ergo.es'),
  title: 'DKV Seguros – Asesoría de salud sin compromiso',
  description: 'Solicita asesoría gratuita en seguros de salud DKV. Asesor personal, respuesta en menos de 24h. Sin listas de espera, sin permanencia mínima.',
  keywords: ['seguro de salud', 'DKV', 'seguro médico', 'asesor salud', 'seguro familiar'],
  authors: [{ name: 'DKV Seguros' }],
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'DKV Seguros' },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
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
        <Analytics />
        <VercelAnalytics />
        <WebTracker />
      </body>
    </html>
  )
}

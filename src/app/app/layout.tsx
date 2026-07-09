import type { Metadata, Viewport } from 'next'
import { MobileShell } from './MobileShell'

export const metadata: Metadata = {
  title: 'DKV Asesores',
  description: 'Gestiona tus leads DKV desde el móvil.',
  manifest: '/app.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'DKV Asesores' },
  icons: { apple: '/logo-cuadrado.png' },
}

export const viewport: Viewport = {
  themeColor: '#0a2f27',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <MobileShell>{children}</MobileShell>
}

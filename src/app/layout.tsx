import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'DKV Seguros – Asesoría sin compromiso',
  description: 'Solicita asesoría gratuita en seguros de salud DKV. Sin listas de espera.',
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

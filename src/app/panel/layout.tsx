'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setEmail(data.session.user.email ?? null)
        setChecked(true)
      } else if (!pathname.includes('/login')) {
        router.replace('/panel/login')
      } else {
        setChecked(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setEmail(session.user.email ?? null)
        setChecked(true)
      } else if (!pathname.includes('/login')) {
        router.replace('/panel/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname])

  if (pathname.includes('/login')) return <>{children}</>
  if (!checked) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f1f4f2' }}>
      <div className="text-[14px]" style={{ color: '#6b7a76' }}>Cargando…</div>
    </div>
  )
  if (!email) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={email} />
      <div className="flex-1 overflow-auto" style={{ background: '#f1f4f2' }}>
        {children}
      </div>
    </div>
  )
}

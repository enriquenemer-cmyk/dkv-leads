import type { LucideIcon } from 'lucide-react'

type Props = {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

/** Estado vacío consistente para listas, tablas y paneles sin datos. */
export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div style={{ padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eef4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Icon size={24} color="#0F7A63" strokeWidth={1.8} />
      </div>
      <p style={{ color: '#16201d', fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</p>
      {description && <p style={{ color: '#9aaba5', fontSize: 13.5, fontWeight: 500, margin: 0, maxWidth: 340, lineHeight: 1.5 }}>{description}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  )
}

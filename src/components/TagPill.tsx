const TAG_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  caliente: { bg: '#fbe7e2', color: '#c23a22', label: '🔥 Caliente' },
  tibio:    { bg: '#f8efd9', color: '#a8741a', label: '🌤 Tibio' },
  frio:     { bg: '#e6f0fa', color: '#2b6fb0', label: '❄️ Frío' },
  cliente:  { bg: '#e3f1ec', color: '#0F7A63', label: '✓ Cliente' },
}

export function TagPill({ tag }: { tag: string }) {
  const s = TAG_STYLES[tag] ?? TAG_STYLES.frio
  return (
    <span
      style={{ background: s.bg, color: s.color }}
      className="text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
    >
      {s.label}
    </span>
  )
}

export { TAG_STYLES }

/** Indicador de carga con spinner, consistente en todo el panel. */
export function Loader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div style={{ padding: '52px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <style>{`@keyframes dkv-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        border: '3px solid #e2e8e4', borderTopColor: '#0F7A63',
        animation: 'dkv-spin 0.7s linear infinite',
      }} />
      <span style={{ color: '#9aaba5', fontSize: 13.5, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

import { Loader } from '@/components/Loader'

export default function PanelLoading() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader label="Cargando…" />
    </div>
  )
}

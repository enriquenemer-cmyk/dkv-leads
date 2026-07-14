// Paleta suave y armónica: cada persona tiene su color (según su nombre).
const PALETAS: { from: string; to: string; text: string }[] = [
  { from: '#e3f1ec', to: '#c9e7db', text: '#0F7A63' }, // verde marca
  { from: '#d8f0ea', to: '#bfe6dc', text: '#0e8a72' }, // teal
  { from: '#e6f0fa', to: '#d1e4f6', text: '#2b6fb0' }, // azul
  { from: '#efe9fb', to: '#e0d6f5', text: '#6b4ab0' }, // morado
  { from: '#f8efd9', to: '#f1e1bd', text: '#a8741a' }, // ámbar
  { from: '#fbe7e2', to: '#f6d4cc', text: '#c23a22' }, // coral
  { from: '#eaf4d9', to: '#dcedbf', text: '#5c7a1e' }, // lima
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function Avatar({ nombre, size = 40 }: { nombre: string; size?: number }) {
  const limpio = (nombre || '').trim()
  const initials = limpio
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const p = PALETAS[hash(limpio.toLowerCase() || '?') % PALETAS.length]

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
        color: p.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
        boxShadow: 'inset 0 0 0 1px rgba(16,32,29,0.05)',
      }}
    >
      {initials || '?'}
    </div>
  )
}

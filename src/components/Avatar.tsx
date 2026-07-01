export function Avatar({ nombre, size = 40 }: { nombre: string; size?: number }) {
  const initials = nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#e3f1ec',
        color: '#0F7A63',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </div>
  )
}

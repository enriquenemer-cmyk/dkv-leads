export function DkvLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const boxSize = size === 'sm' ? 32 : size === 'lg' ? 44 : 38
  const plusSize = size === 'sm' ? 18 : size === 'lg' ? 24 : 20
  const dkvSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl'

  return (
    <div className="flex items-center gap-2.5">
      <div
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: 9,
          background: '#0F7A63',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: plusSize,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        +
      </div>
      <div>
        <div className={`font-extrabold text-[#16201d] leading-none ${dkvSize}`}>DKV</div>
        <div className="text-[11px] text-[#6b7a76] font-medium leading-tight mt-0.5">Seguros de salud</div>
      </div>
    </div>
  )
}

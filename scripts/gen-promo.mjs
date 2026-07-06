import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

// Imagen cuadrada 1080x1080 para WhatsApp (estados/grupos) e Instagram.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#063f3b"/>
      <stop offset="0.55" stop-color="#095751"/>
      <stop offset="1" stop-color="#0d6b5f"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="950" cy="150" r="340" fill="#98A92A" opacity="0.14"/>
  <circle cx="120" cy="980" r="260" fill="#000000" opacity="0.10"/>

  <!-- wordmark -->
  <text x="90" y="170" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900" letter-spacing="-3">
    <tspan fill="#98A92A">D</tspan><tspan fill="#ffffff">KV</tspan>
  </text>
  <text x="92" y="205" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600" fill="#cfe3d9" letter-spacing="2">SEGUROS DE SALUD · AGENTE EXCLUSIVO</text>

  <!-- headline -->
  <text x="90" y="400" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="800" fill="#ffffff" letter-spacing="-3">Tu seguro médico</text>
  <text x="90" y="500" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="800" fill="#7ee8c8" letter-spacing="-3">sin listas de espera</text>

  <!-- bullets -->
  <g font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600" fill="#e8f2ec">
    <text x="98" y="610">✓  +51.000 médicos en toda España</text>
    <text x="98" y="672">✓  Cobertura desde el primer día</text>
    <text x="98" y="734">✓  Dental para toda la familia desde 9€/mes</text>
  </g>

  <!-- descuento badge -->
  <g transform="translate(90,790)">
    <rect width="430" height="72" rx="36" fill="#DD3636"/>
    <text x="215" y="48" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#ffffff">Hasta -35% de descuento</text>
  </g>

  <!-- CTA -->
  <text x="90" y="960" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="800" fill="#ffffff">Calcula tu precio GRATIS en:</text>
  <text x="90" y="1015" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="#98A92A" letter-spacing="0.5">dkv-ergo.es</text>
</svg>`

const out = 'public/promo-whatsapp.png'
const png = await sharp(Buffer.from(svg)).png().toBuffer()
writeFileSync(out, png)
console.log('OK →', out, png.length, 'bytes')

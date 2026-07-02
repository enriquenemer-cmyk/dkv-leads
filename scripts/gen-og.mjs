import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#063f3b"/>
      <stop offset="0.55" stop-color="#095751"/>
      <stop offset="1" stop-color="#0d6b5f"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="120" r="300" fill="#98A92A" opacity="0.14"/>
  <circle cx="120" cy="560" r="220" fill="#000000" opacity="0.10"/>
  <!-- wordmark -->
  <text x="80" y="150" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="900" letter-spacing="-3">
    <tspan fill="#98A92A">D</tspan><tspan fill="#ffffff">KV</tspan>
  </text>
  <text x="80" y="185" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600" fill="#cfe3d9" letter-spacing="2">SEGUROS DE SALUD</text>
  <!-- headline -->
  <text x="80" y="345" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="800" fill="#ffffff" letter-spacing="-2">Tu salud merece</text>
  <text x="80" y="435" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="800" fill="#7ee8c8" letter-spacing="-2">la mejor cobertura</text>
  <!-- subtitle -->
  <text x="82" y="500" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="500" fill="#d7e5df">Asesoría gratuita · Respuesta en menos de 24h</text>
  <!-- badge -->
  <g transform="translate(80,540)">
    <rect width="360" height="58" rx="29" fill="#DD3636"/>
    <text x="180" y="38" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="800" fill="#ffffff">Hasta -35% de descuento</text>
  </g>
</svg>`

const png = await sharp(Buffer.from(svg)).png().toBuffer()
writeFileSync(new URL('../public/og-image.png', import.meta.url), png)
console.log('og-image.png generado:', png.length, 'bytes')

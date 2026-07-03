import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

// Logo cuadrado 1:1 para Google Ads (1200x1200), fondo blanco, marca centrada
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" fill="#ffffff"/>
  <rect x="60" y="60" width="1080" height="1080" rx="80" fill="#F3F4E7"/>
  <text x="600" y="600" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="300" font-weight="900" letter-spacing="-12">
    <tspan fill="#98A92A">D</tspan><tspan fill="#095751">KV</tspan>
  </text>
  <text x="600" y="700" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="#6A625A" letter-spacing="6">SEGUROS DE SALUD</text>
</svg>`

const png = await sharp(Buffer.from(svg)).png().toBuffer()
writeFileSync(new URL('../public/logo-cuadrado.png', import.meta.url), png)
console.log('logo-cuadrado.png generado:', png.length, 'bytes')

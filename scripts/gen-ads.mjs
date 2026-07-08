import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

// Imágenes para Google Ads. Texto mínimo (Google penaliza el exceso de texto).
const brand = (w, h, titleSize, y1, y2) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#063f3b"/><stop offset="0.55" stop-color="#095751"/><stop offset="1" stop-color="#0d6b5f"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${w * 0.86}" cy="${h * 0.16}" r="${h * 0.42}" fill="#98A92A" opacity="0.14"/>
  <circle cx="${w * 0.1}" cy="${h * 0.92}" r="${h * 0.3}" fill="#000000" opacity="0.1"/>
  <text x="${w * 0.07}" y="${h * 0.19}" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize * 0.62}" font-weight="900" letter-spacing="-2">
    <tspan fill="#98A92A">D</tspan><tspan fill="#ffffff">KV</tspan>
  </text>
  <text x="${w * 0.07}" y="${y1}" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff" letter-spacing="-2">Tu salud no espera.</text>
  <text x="${w * 0.07}" y="${y2}" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="800" fill="#7ee8c8" letter-spacing="-2">Seguro médico DKV.</text>
  <text x="${w * 0.072}" y="${y2 + titleSize * 0.85}" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize * 0.42}" font-weight="600" fill="#d7e5df">+51.000 médicos · sin listas de espera</text>
</svg>`

const jobs = [
  { name: 'ad-horizontal.png', svg: brand(1200, 628, 74, 340, 430) },
  { name: 'ad-cuadrada.png', svg: brand(1200, 1200, 84, 560, 670) },
]
for (const j of jobs) {
  const png = await sharp(Buffer.from(j.svg)).png().toBuffer()
  writeFileSync(`public/${j.name}`, png)
  console.log('OK →', j.name, png.length, 'bytes')
}

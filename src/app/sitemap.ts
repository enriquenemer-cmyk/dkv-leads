import type { MetadataRoute } from 'next'
import { SEGUROS, ARTICULOS, slugify } from './dkv/fichas'

const BASE = 'https://dkv-ergo.es'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages = [
    { url: `${BASE}/dkv`, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${BASE}/dkv/privacidad`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE}/dkv/aviso-legal`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE}/dkv/cookies`, priority: 0.3, changeFrequency: 'yearly' as const },
  ]

  const seguros = SEGUROS.map(s => ({
    url: `${BASE}/dkv/seguro/${slugify(s.title)}`,
    priority: 0.8, changeFrequency: 'monthly' as const,
  }))

  const blog = ARTICULOS.map(a => ({
    url: `${BASE}/dkv/blog/${slugify(a.title)}`,
    priority: 0.6, changeFrequency: 'monthly' as const,
  }))

  return [...staticPages, ...seguros, ...blog].map(p => ({ ...p, lastModified: now }))
}

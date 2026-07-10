import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/panel/', '/api/'],
    },
    sitemap: 'https://ergopymes.com/sitemap.xml',
    host: 'https://ergopymes.com',
  }
}

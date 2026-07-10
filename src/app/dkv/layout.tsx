import type { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import ChatWidget from '@/components/ChatWidget'
import { TITULAR } from './legal-data'

const BASE = 'https://ergopymes.com'

export const metadata: Metadata = {
  title: 'Seguro de Salud DKV | Calcula tu precio con hasta -35% de descuento',
  description: 'Contrata tu seguro médico DKV con asesoramiento gratuito: +51.000 médicos, cobertura desde el primer día y hasta un 35% de descuento. Calcula tu precio en 1 minuto, sin compromiso.',
  keywords: ['seguro de salud DKV', 'seguro médico DKV', 'DKV Famedic', 'seguro sin copago', 'seguro dental DKV', 'cuadro médico DKV', 'calcular seguro salud'],
  alternates: { canonical: '/dkv' },
  openGraph: {
    title: 'Seguro de Salud DKV | Hasta -35% de descuento',
    description: 'Calcula tu seguro médico DKV en 1 minuto. Asesor gratuito, +51.000 médicos y cobertura desde el primer día.',
    url: `${BASE}/dkv`,
    type: 'website',
    locale: 'es_ES',
    siteName: 'DKV Seguros de Salud',
  },
}

const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'InsuranceAgency',
  name: 'DKV Seguros de Salud',
  legalName: TITULAR.nombre,
  url: `${BASE}/dkv`,
  image: `${BASE}/og-image.png`,
  logo: `${BASE}/dkv-logo.png`,
  telephone: '+34699669603',
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  areaServed: ['España', 'Madrid', 'Sevilla', 'León', 'Salamanca', 'Valladolid'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'C/ Príncipe de Vergara 80',
    postalCode: '28006',
    addressLocality: 'Madrid',
    addressRegion: 'Madrid',
    addressCountry: 'ES',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 40.4297,
    longitude: -3.6769,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '19:00',
  },
  knowsAbout: ['Seguros de salud', 'Seguros dentales', 'Seguros médicos DKV', 'Seguro familiar', 'Seguro sin copago', 'Seguro de reembolso'],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '2000',
  },
}

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DKV Seguros de Salud',
  url: `${BASE}/dkv`,
  inLanguage: 'es-ES',
}

export default function DkvLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Precarga de la imagen del hero (elemento LCP) con prioridad alta */}
      <link
        rel="preload"
        as="image"
        href="/images/hero.jpg"
        fetchPriority="high"
      />
      <JsonLd data={[orgLd, websiteLd]} />
      {children}
      <ChatWidget />
    </>
  )
}

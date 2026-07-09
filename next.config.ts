import type { NextConfig } from "next";

// Slugs de campaña con URL limpia → sirven la landing /dkv (rewrite: la URL se mantiene bonita)
const CAMPANAS = [
  'seguro-dental',
  'seguro-familiar',
  'seguro-sin-copago',
  'seguro-reembolso',
  'seguro-autonomos',
  'seguro-sin-listas-de-espera',
  'seguro-salud',
]

const nextConfig: NextConfig = {
  // Fija la raíz del workspace a este proyecto. Evita el aviso de Next
  // "inferred your workspace root ... multiple lockfiles" cuando hay varios
  // package-lock.json/pnpm-lock.yaml en directorios superiores.
  turbopack: { root: __dirname },
  async redirects() {
    return [
      // El dominio raíz muestra la web DKV
      { source: '/', destination: '/dkv', permanent: false },
    ]
  },
  async rewrites() {
    // Cada URL de campaña muestra la landing completa; el tema del hero se detecta por la ruta
    return CAMPANAS.map(slug => ({ source: `/${slug}`, destination: '/dkv' }))
  },
};

export default nextConfig;

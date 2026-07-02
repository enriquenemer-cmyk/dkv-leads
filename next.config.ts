import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // El dominio raíz muestra la web DKV
      { source: '/', destination: '/dkv', permanent: false },
    ]
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // imagen Docker más ligera
  // Proxy: el navegador solo habla con su propio origen (/api/*) y Next reenvía
  // al backend. Así, con un solo HTTPS (túnel) funcionan la cámara + la API desde
  // el celular, sin bloqueo por "contenido mixto".
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:4000';
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;

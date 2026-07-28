/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // imagen Docker más ligera
  // El proxy /api ya NO va aquí: lo implementa el route handler
  // src/app/api/[...ruta]/route.js, que resuelve el backend en caliente
  // (entorno → DNS → IP fija → localhost) y lo revalida cada 30 s.
  // Así el frontend reencuentra al backend aunque cambie de laptop.
};

export default nextConfig;

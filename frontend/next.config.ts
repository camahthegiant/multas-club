import type { NextConfig } from "next";

// En producción Traefik enruta /api y /uploads directamente al contenedor
// backend (ver docker-compose.prod.yml, prioridad de router), así que este
// rewrite solo entra en juego en desarrollo local, donde no hay Traefik
// delante y el frontend sí necesita reenviar al backend por su nombre de
// servicio en la red de Docker.
const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://backend:8000/api/:path*" },
      { source: "/uploads/:path*", destination: "http://backend:8000/uploads/:path*" },
    ];
  },
};

export default nextConfig;

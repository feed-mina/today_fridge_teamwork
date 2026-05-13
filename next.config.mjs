import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const API_PROXY_TARGET = process.env.BACKEND_ORIGIN || "http://localhost:8080";

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io", "*.trycloudflare.com"],
  async rewrites() {
    return [
      {
        source: '/api/images/:path*',
        destination: 'http://43.201.1.45/uploads/:path*',
      },
      {
        source: "/api/v1/:path*",
        destination: `${API_PROXY_TARGET}/api/v1/:path*`,
      },
    ];
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;

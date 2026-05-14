import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io", "*.trycloudflare.com"],
  async rewrites() {
    return [
      {
        source: '/api/images/:path*',
        destination: 'http://43.201.1.45/uploads/:path*',
      },
    ];
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;

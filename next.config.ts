import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  // Add this to allow cross-origin requests from the specified origin
  experimental: {
    allowedDevOrigins: ['https://9003-firebase-studio-1751478819381.cluster-pgviq6mvsncnqxx6kr7pbz65v6.cloudworkstations.dev'],
  },
};

export default nextConfig;

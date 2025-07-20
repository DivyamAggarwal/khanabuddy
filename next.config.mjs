/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com"],
  },
  experimental: {
    useLightningcss: false,
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Force disable lightningcss
      config.resolve.alias = {
        ...config.resolve.alias,
        'lightningcss': false,
      };
    }
    return config;
  },
};

export default nextConfig;
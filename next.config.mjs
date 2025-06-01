/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.crypto-bonus.cointelegraph.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;

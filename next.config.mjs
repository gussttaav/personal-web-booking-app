/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CAL_URL: process.env.NEXT_PUBLIC_CAL_URL,
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.licdn.com" },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Only expose env vars that must be public (used in browser-side code).
  // The cal.com event slugs are hardcoded in constants/index.ts;
  // NEXT_PUBLIC_CAL_EVENT_SLUG overrides the pack-booking event if set.
  env: {
    NEXT_PUBLIC_CAL_EVENT_SLUG: process.env.NEXT_PUBLIC_CAL_EVENT_SLUG,
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "@auth/prisma-adapter", "next-auth", "jsonwebtoken"],
};

export default nextConfig;

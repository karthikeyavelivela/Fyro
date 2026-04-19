/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    domains: ['res.cloudinary.com', 'ui-avatars.com'],
  },
}
export default nextConfig

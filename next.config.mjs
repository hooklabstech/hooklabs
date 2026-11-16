/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // Wagmi exports optional Tempo support, which references mppx/client.
  // HOOKLABS does not use Tempo; exclude that optional client module in Webpack.
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "mppx/client": false,
    }
    return config
  },
  async headers() {
    return [{ source: "/config.json", headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }] }, { source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }]
  },
}

export default nextConfig

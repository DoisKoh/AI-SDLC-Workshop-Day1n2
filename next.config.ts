import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module and must not be bundled by the server build.
  serverExternalPackages: ['better-sqlite3'],
  // Pin the workspace root (a stray lockfile in $HOME otherwise confuses Next's
  // file-tracing inference) so production output traces the right files.
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  // Surface lint/type issues at build time rather than silently passing.
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ]
  },
}

export default nextConfig

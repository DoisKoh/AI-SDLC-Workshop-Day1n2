import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    // Unit tests run against an in-memory SQLite DB and a fixed secret.
    env: {
      DATABASE_PATH: ':memory:',
      JWT_SECRET: 'unit-test-secret-must-be-at-least-32-characters-long',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts'],
      // Excluded: framework/browser boundaries that are covered by E2E rather
      // than unit tests (React hooks, next/headers + next/server wrappers,
      // browser fetch clients) and static constant files.
      exclude: [
        'lib/**/*.d.ts',
        'lib/api-client.ts',
        'lib/auth-client.ts',
        'lib/hooks/**',
        'lib/auth.ts',
        'lib/webauthn.ts',
        'lib/api-response.ts',
        'lib/testids.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname.replace(/\/$/, ''),
    },
  },
})

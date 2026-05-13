import { defineConfig } from 'vite';

// Dedicated config for the visual test suite. Spinning up Playwright + Typst
// is too expensive for the default `pnpm test`, so contributors opt in via
// `pnpm test:visual`.
export default defineConfig({
  test: {
    include: ['test/visual/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});

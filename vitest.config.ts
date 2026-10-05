import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test-support/**', 'src/main.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
    },
  },
});

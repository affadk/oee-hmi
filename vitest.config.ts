import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        lines: 50,
        branches: 60,
        functions: 50,
        statements: 50,
      },
    },
  },
});

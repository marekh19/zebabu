import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: [
            'src/**/*.svelte.{test,spec}.{js,ts}',
            'src/lib/server/persistence/constraints.integration.test.ts',
            'src/lib/server/persistence/auth-sessions.postgres.test.ts',
            'src/lib/server/persistence/concurrency.postgres.test.ts',
            'src/lib/server/persistence/ownership.postgres.test.ts',
            'src/routes/(private)/budgets/[id]/transactions/[transactionId]/paid/paid.integration.test.ts',
            'src/routes/(private)/budgets/[id]/transactions/[transactionId]/position/position.integration.test.ts',
          ],
        },
      },
    ],
  },
})

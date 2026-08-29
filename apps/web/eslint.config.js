import { createSvelteEslintConfig } from '@zebabu/tooling/eslint'
import svelteConfig from './svelte.config.js'

export default createSvelteEslintConfig({
  workspaceDirectory: import.meta.dirname,
  svelteConfig,
  additionalConfigs: [
    {
      ignores: ['.svelte-kit/**', 'src/lib/paraglide/**', 'build/**'],
    },
    {
      files: ['src/lib/budget-planning/**/*.{ts,svelte}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '$lib/identity',
                  '$lib/identity/**',
                  '**/identity',
                  '**/identity/**',
                ],
                message: 'Budget Planning cannot import Identity.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/lib/identity/**/*.{ts,svelte}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '$lib/budget-planning',
                  '$lib/budget-planning/**',
                  '**/budget-planning',
                  '**/budget-planning/**',
                ],
                message: 'Identity cannot import Budget Planning.',
              },
            ],
          },
        ],
      },
    },
  ],
})

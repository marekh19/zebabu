import { createSvelteEslintConfig } from '@zebabu/tooling/eslint'
import svelteConfig from './svelte.config.js'

export default createSvelteEslintConfig({
  workspaceDirectory: import.meta.dirname,
  svelteConfig,
  additionalConfigs: [
    {
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['$app/*', '$lib/*', '@zebabu/web/*'],
                message: 'UI cannot import application code.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/**/*.svelte'],
      rules: {
        'svelte/no-navigation-without-resolve': 'off',
        'no-useless-assignment': 'off',
      },
    },
  ],
})

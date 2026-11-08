import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: ['src/hooks.ts'],
  project: ['src/**/*.{ts,svelte}'],
  ignoreDependencies: ['tailwindcss'],
  ignoreBinaries: ['knip'],
  ignoreExportsUsedInFile: true,
}

export default config

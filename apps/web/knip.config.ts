import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: ['src/hooks.ts', 'src/migrate.mjs'],
  project: ['src/**/*.{ts,svelte}'],
  ignoreDependencies: ['tw-animate-css'],
}

export default config

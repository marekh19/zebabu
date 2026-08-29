import { asyncCompilerOptions } from '@zebabu/tooling/svelte'
import adapter from 'svelte-adapter-bun'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    experimental: {
      remoteFunctions: true,
    },
  },
  compilerOptions: asyncCompilerOptions,
}

export default config

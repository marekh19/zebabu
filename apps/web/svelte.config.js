import { asyncCompilerOptions } from '@zebabu/tooling/svelte'
import adapter from 'svelte-adapter-bun'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
  },
  compilerOptions: asyncCompilerOptions,
}

export default config

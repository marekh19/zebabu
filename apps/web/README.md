# Zebabu web

SvelteKit owns UI, SSR page composition, localization, and form adapters. Browser requests use same-origin `/api/*` routes. Server loads and actions call `API_INTERNAL_URL` with the original Cookie, Origin, and request ID.

For local development, set `API_INTERNAL_URL=http://localhost:3101` and `ORIGIN=http://localhost:3000` in `apps/web/.env`, start `@zebabu/api` on port 3101, and run `bun run --filter @zebabu/web dev`. Vite proxies `/api/*` to the API. Set `ORIGIN` to the public web origin in production so SvelteKit accepts same-origin form submissions.

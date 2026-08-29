export default {
  '*.{ts,js,svelte}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,css,html,yaml,yml}': 'prettier --write',
}

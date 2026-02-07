<script lang="ts">
  import { Button } from '@zebabu/ui'

  let count = $state(0)

  const handleIncrement = () => {
    count += 1
  }
</script>

<h1>Welcome to SvelteKit</h1>
<p>
  Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the
  documentation
</p>

<Button onclick={handleIncrement}>Count: {count}</Button>

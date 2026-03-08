<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import * as Dialog from '$lib/components/ui/dialog'

  type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmLabel: string
    cancelLabel: string
    onConfirm: () => void
    loading?: boolean
  }

  let {
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel,
    onConfirm,
    loading = false,
  }: Props = $props()
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content showCloseButton={false}>
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button
        variant="outline"
        disabled={loading}
        onclick={() => onOpenChange(false)}
      >
        {cancelLabel}
      </Button>
      <Button variant="destructive" disabled={loading} onclick={onConfirm}>
        {confirmLabel}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

import type { ActionResult } from '@sveltejs/kit'
import { toast } from 'svelte-sonner'

export function createDialogSuccessHandler(
  onOpenChange: (open: boolean) => void,
  getMessage: () => string,
) {
  return ({ result }: { result: ActionResult }) => {
    if (result.type !== 'success') return

    const message = getMessage()
    onOpenChange(false)
    toast.success(message)
  }
}

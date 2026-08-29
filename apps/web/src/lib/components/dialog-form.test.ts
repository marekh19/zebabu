import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ success: vi.fn() }))

vi.mock('svelte-sonner', () => ({ toast: { success: mocks.success } }))

import { createDialogSuccessHandler } from './dialog-form'

describe('createDialogSuccessHandler', () => {
  beforeEach(() => vi.clearAllMocks())

  it('closes the dialog and shows the message after success', () => {
    const onOpenChange = vi.fn()
    const getMessage = vi.fn(() => 'Created')
    const onResult = createDialogSuccessHandler(onOpenChange, getMessage)

    onResult({ result: { type: 'success', status: 200, data: {} } })

    expect(getMessage).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mocks.success).toHaveBeenCalledWith('Created')
  })

  it('ignores non-success results', () => {
    const onOpenChange = vi.fn()
    const getMessage = vi.fn(() => 'Created')
    const onResult = createDialogSuccessHandler(onOpenChange, getMessage)

    onResult({
      result: { type: 'failure', status: 400, data: { error: 'Invalid' } },
    })

    expect(getMessage).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
  })
})

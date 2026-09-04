import { describe, expect, it, vi } from 'vitest'
import { createPaidToggleQueue } from './paid-toggle-queue'

function deferred() {
  let resolve: () => void = () => {}
  let reject: () => void = () => {}
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('paid toggle queue', () => {
  it('updates immediately and establishes the confirmed state', async () => {
    const persist = vi.fn().mockResolvedValue(undefined)
    const onChange = vi.fn()
    const queue = createPaidToggleQueue({
      persist,
      onChange,
      onBusyChange: vi.fn(),
      onError: vi.fn(),
    })

    queue.toggle('transaction-1', false)

    expect(onChange).toHaveBeenCalledWith('transaction-1', true)
    await vi.waitFor(() => expect(persist).toHaveBeenCalledTimes(1))

    queue.toggle('transaction-1', true)
    await vi.waitFor(() => expect(persist).toHaveBeenCalledTimes(2))
    expect(persist).toHaveBeenLastCalledWith('transaction-1', false)
  })

  it('coalesces rapid changes to the latest desired state', async () => {
    const first = deferred()
    const persist = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValue(undefined)
    const queue = createPaidToggleQueue({
      persist,
      onChange: vi.fn(),
      onBusyChange: vi.fn(),
      onError: vi.fn(),
    })

    queue.toggle('transaction-1', false)
    queue.toggle('transaction-1', true)
    queue.toggle('transaction-1', false)
    queue.toggle('transaction-1', true)
    first.resolve()

    await vi.waitFor(() => expect(persist).toHaveBeenCalledTimes(2))
    expect(persist).toHaveBeenNthCalledWith(1, 'transaction-1', true)
    expect(persist).toHaveBeenNthCalledWith(2, 'transaction-1', false)
  })

  it('restores the confirmed state and reports one failure', async () => {
    const pending = deferred()
    const onChange = vi.fn()
    const onError = vi.fn()
    const queue = createPaidToggleQueue({
      persist: () => pending.promise,
      onChange,
      onBusyChange: vi.fn(),
      onError,
    })

    queue.toggle('transaction-1', false)
    queue.toggle('transaction-1', true)
    pending.reject()

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(onChange).toHaveBeenCalledTimes(3)
    expect(onChange).toHaveBeenLastCalledWith('transaction-1', false)
  })
})

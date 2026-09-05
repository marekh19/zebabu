import { describe, expect, it, vi } from 'vitest'
import { commitTransactionPosition } from './transaction-position'

describe('commitTransactionPosition', () => {
  it('locks dragging through persistence and refresh', async () => {
    const events: string[] = []

    await expect(
      commitTransactionPosition({
        persist: async () => {
          events.push('persist')
          return new Response(null, { status: 200 })
        },
        refresh: async () => {
          events.push('refresh')
        },
        onBusyChange: (busy) => events.push(`busy:${busy}`),
        onFailure: vi.fn(),
      }),
    ).resolves.toBe(true)
    expect(events).toEqual(['busy:true', 'persist', 'refresh', 'busy:false'])
  })

  it('rolls back once and unlocks after a failed request', async () => {
    const onFailure = vi.fn()
    const onBusyChange = vi.fn()

    await expect(
      commitTransactionPosition({
        persist: async () => new Response(null, { status: 500 }),
        refresh: vi.fn(),
        onBusyChange,
        onFailure,
      }),
    ).resolves.toBe(false)
    expect(onFailure).toHaveBeenCalledOnce()
    expect(onBusyChange).toHaveBeenNthCalledWith(1, true)
    expect(onBusyChange).toHaveBeenNthCalledWith(2, false)
  })
})

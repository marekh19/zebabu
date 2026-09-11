import { describe, expect, it, vi } from 'vitest'
import { commitTransactionPosition } from './transaction-drag.svelte'

describe('commitTransactionPosition', () => {
  it('locks dragging through persistence and refresh', async () => {
    const onBusyChange = vi.fn()
    const persist = vi.fn(async () => {
      expect(onBusyChange).toHaveBeenLastCalledWith(true)
      return new Response(null, { status: 200 })
    })
    const refresh = vi.fn(async () => {
      expect(onBusyChange).toHaveBeenLastCalledWith(true)
    })

    await expect(
      commitTransactionPosition({
        persist,
        refresh,
        onBusyChange,
        onRollback: vi.fn(),
        onSettled: vi.fn(),
      }),
    ).resolves.toBe('saved')
    expect(persist).toHaveBeenCalledOnce()
    expect(refresh).toHaveBeenCalledOnce()
    expect(onBusyChange).toHaveBeenNthCalledWith(1, true)
    expect(onBusyChange).toHaveBeenNthCalledWith(2, false)
  })

  it('rolls back once and unlocks after a failed request', async () => {
    const onRollback = vi.fn()
    const onBusyChange = vi.fn()
    const onSettled = vi.fn()

    await expect(
      commitTransactionPosition({
        persist: async () => new Response(null, { status: 500 }),
        refresh: vi.fn(),
        onBusyChange,
        onRollback,
        onSettled,
      }),
    ).resolves.toBe('save-failed')
    expect(onRollback).toHaveBeenCalledOnce()
    expect(onSettled).toHaveBeenCalledOnce()
    expect(onBusyChange).toHaveBeenNthCalledWith(1, true)
    expect(onBusyChange).toHaveBeenNthCalledWith(2, false)
  })

  it('surfaces a refresh failure without rolling back a confirmed move', async () => {
    const onRollback = vi.fn()

    await expect(
      commitTransactionPosition({
        persist: async () => new Response(null, { status: 200 }),
        refresh: async () => {
          throw new Error('Refresh failed')
        },
        onBusyChange: vi.fn(),
        onRollback,
        onSettled: vi.fn(),
      }),
    ).resolves.toBe('refresh-failed')
    expect(onRollback).not.toHaveBeenCalled()
  })
})

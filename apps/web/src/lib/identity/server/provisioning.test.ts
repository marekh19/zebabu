import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findProvisioningStateTx: vi.fn(),
  insertDefaultCategoriesTx: vi.fn(),
  lockUserProvisioningTx: vi.fn(),
  markUserProvisionedTx: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('$lib/server/persistence/database', () => ({
  database: { transaction: mocks.transaction },
}))

vi.mock('./provisioning-repository', () => mocks)

import { ensureUserProvisioned, UnsupportedLocaleError } from './provisioning'

describe('ensureUserProvisioned', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(
      (operation: (transaction: object) => unknown) =>
        operation({ id: 'transaction' }),
    )
  })

  it('retries a partial insert by adding only the missing default type', async () => {
    mocks.findProvisioningStateTx.mockResolvedValue({
      isProvisioned: false,
      categories: [{ type: 'income' }],
    })

    await ensureUserProvisioned('user-1', 'en')

    expect(mocks.insertDefaultCategoriesTx).toHaveBeenCalledWith(
      { id: 'transaction' },
      [
        {
          userId: 'user-1',
          name: 'Expenses',
          type: 'expense',
          color: 'rose',
        },
      ],
    )
    expect(mocks.markUserProvisionedTx).toHaveBeenCalledWith(
      { id: 'transaction' },
      'user-1',
    )
  })

  it('serializes duplicate requests and skips completed users', async () => {
    mocks.findProvisioningStateTx.mockResolvedValue({
      isProvisioned: true,
      categories: [],
    })

    await Promise.all([
      ensureUserProvisioned('user-1', 'en'),
      ensureUserProvisioned('user-1', 'en'),
    ])

    expect(mocks.lockUserProvisioningTx).toHaveBeenCalledTimes(2)
    expect(mocks.insertDefaultCategoriesTx).not.toHaveBeenCalled()
    expect(mocks.markUserProvisionedTx).not.toHaveBeenCalled()
  })

  it('rejects an unsupported locale before opening a transaction', async () => {
    await expect(ensureUserProvisioned('user-1', 'de')).rejects.toBeInstanceOf(
      UnsupportedLocaleError,
    )
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('uses the explicit locale for both default names', async () => {
    mocks.findProvisioningStateTx.mockResolvedValue({
      isProvisioned: false,
      categories: [],
    })

    await ensureUserProvisioned('user-1', 'cs')

    expect(mocks.insertDefaultCategoriesTx).toHaveBeenCalledWith(
      { id: 'transaction' },
      expect.arrayContaining([
        expect.objectContaining({ type: 'income', name: 'Příjmy' }),
        expect.objectContaining({ type: 'expense', name: 'Výdaje' }),
      ]),
    )
  })
})

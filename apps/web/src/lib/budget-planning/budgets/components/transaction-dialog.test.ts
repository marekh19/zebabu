import { describe, expect, it } from 'vitest'
import { shouldAcceptDialogOpenChange } from './transaction-dialog'

describe('shouldAcceptDialogOpenChange', () => {
  it('rejects close requests while submitting', () => {
    expect(shouldAcceptDialogOpenChange(false, true)).toBe(false)
  })

  it('accepts close requests after submission', () => {
    expect(shouldAcceptDialogOpenChange(false, false)).toBe(true)
  })
})

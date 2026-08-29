import { describe, expect, it } from 'vitest'
import { getActionError } from './errors'

const errorMessages = {
  duplicate: () => 'Duplicate',
  unexpected: () => 'Unexpected',
}

describe('getActionError', () => {
  it('returns only known errors from the requested field', () => {
    expect(getActionError({ error: 'duplicate' }, 'error', errorMessages)).toBe(
      'duplicate',
    )
    expect(
      getActionError({ error: 'unknown' }, 'error', errorMessages),
    ).toBeUndefined()
    expect(
      getActionError({ other: 'duplicate' }, 'error', errorMessages),
    ).toBeUndefined()
  })
})

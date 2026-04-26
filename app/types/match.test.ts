import { describe, it, expect } from 'vitest'
import { isMatchVisible } from './match'

describe('isMatchVisible', () => {
  it('returns true when visible is true', () => {
    expect(isMatchVisible({ visible: true })).toBe(true)
  })

  it('returns false when visible is false', () => {
    expect(isMatchVisible({ visible: false })).toBe(false)
  })

  it('returns true when visible is undefined (legacy fallback)', () => {
    expect(isMatchVisible({ visible: undefined })).toBe(true)
  })

  it('returns true when visible field is absent (legacy document)', () => {
    const match = {} as { visible?: boolean }
    expect(isMatchVisible(match)).toBe(true)
  })
})

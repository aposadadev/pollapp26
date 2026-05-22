import { describe, it, expect } from 'vitest'
import { isMatchVisible, isMatchActive, isMatchScheduled } from './match'

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

describe('isMatchActive', () => {
  it('returns true when status is active', () => {
    expect(isMatchActive({ status: 'active', isActive: false, date: new Date(Date.now() + 100000) })).toBe(true)
  })

  it('returns false when status is closed even if date is in the past', () => {
    expect(isMatchActive({ status: 'closed', isActive: true, date: new Date(Date.now() - 100000) })).toBe(false)
  })

  it('returns true when match date is in the past', () => {
    expect(isMatchActive({ status: 'scheduled', isActive: false, date: new Date(Date.now() - 100000) })).toBe(true)
  })

  it('returns false when status is scheduled and date is in the future', () => {
    expect(isMatchActive({ status: 'scheduled', isActive: false, date: new Date(Date.now() + 100000) })).toBe(false)
  })
})

describe('isMatchScheduled', () => {
  it('returns true when match date is in the future and not closed', () => {
    expect(isMatchScheduled({ status: 'scheduled', isActive: false, isClosed: false, date: new Date(Date.now() + 100000) })).toBe(true)
  })

  it('returns false when match date is in the past', () => {
    expect(isMatchScheduled({ status: 'scheduled', isActive: false, isClosed: false, date: new Date(Date.now() - 100000) })).toBe(false)
  })

  it('returns false when match is closed', () => {
    expect(isMatchScheduled({ status: 'closed', isActive: false, isClosed: true, date: new Date(Date.now() + 100000) })).toBe(false)
  })
})

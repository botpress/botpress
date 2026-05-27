import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { BotpressCLIError } from './errors'

describe('BotpressCLIError.map', () => {
  it('maps a bare Error without duplicating its message', () => {
    const mapped = BotpressCLIError.map(new Error('boom'))
    expect(mapped).toBeInstanceOf(BotpressCLIError)
    expect(mapped.message).toBe('boom')
  })

  it('preserves the original thrown error as the cause', () => {
    const original = new Error('boom')
    const mapped = BotpressCLIError.map(original)
    expect(mapped.cause()).toBe(original)
  })

  it('returns a BotpressCLIError unchanged (idempotent)', () => {
    const err = new BotpressCLIError('already mapped')
    expect(BotpressCLIError.map(err)).toBe(err)
  })
})

describe('BotpressCLIError.wrap', () => {
  it('chains the cause message when the cause has one', () => {
    const wrapped = BotpressCLIError.wrap(new Error('real cause'), 'Build failed')
    expect(wrapped.message).toBe('Build failed: real cause')
  })

  it('omits the dangling colon when the cause has no message, but keeps it for fullStack', () => {
    const wrapped = BotpressCLIError.wrap(new Error('', { cause: new Error('DEEP_CAUSE_MARKER') }), 'Build failed')
    expect(wrapped.message).toBe('Build failed')
    expect(BotpressCLIError.fullStack(wrapped)).toContain('DEEP_CAUSE_MARKER')
  })
})

describe('BotpressCLIError.fullStack', () => {
  it('walks the preserved cause so the original throw site is included', () => {
    const mapped = BotpressCLIError.map(new Error('boom'))
    // 'caused by:' only appears when a cause is preserved; it would be absent if map() severed it
    expect(BotpressCLIError.fullStack(mapped)).toContain('caused by:')
  })

  it('recursively follows native Error.cause', () => {
    const inner = new Error('INNER_CAUSE_MARKER')
    const outer = new Error('outer', { cause: inner })

    const mapped = BotpressCLIError.map(outer)
    expect(mapped.cause()).toBe(outer) // outer is preserved (one level)
    expect(BotpressCLIError.fullStack(mapped)).toContain('INNER_CAUSE_MARKER')
  })

  it('follows axios transport causes without changing the mapped message', () => {
    const cause = new Error('AXIOS_CAUSE_MARKER')
    const axiosError = new AxiosError('')
    axiosError.cause = cause

    const mapped = BotpressCLIError.map(axiosError)

    expect(mapped.message).toBe('')
    expect(BotpressCLIError.fullStack(mapped)).toContain('AXIOS_CAUSE_MARKER')
  })
})

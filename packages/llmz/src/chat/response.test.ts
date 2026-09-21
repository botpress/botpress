import { describe, expect, it, vi } from 'vitest'
import { InvalidConfigurationError } from '../errors.js'
import { Chat } from './chat.js'
import { resolveResponse, type Response } from './response.js'

describe('assistant response configuration', () => {
  it('defaults chat and empty response configurations to Markdown', () => {
    expect(new Chat().response).toBe('markdown')
    expect(resolveResponse({})).toEqual(resolveResponse('markdown'))
    expect(resolveResponse().instructions).toContain('natural Markdown')
  })

  it.each([{ handler: () => {} }, { onMessageDelta: () => {} }, { transcript: [] }, { unexpected: true }])(
    'rejects removed or unknown chat options instead of losing delivery callbacks',
    (options) => {
      expect(() => new Chat(options as never)).toThrow(InvalidConfigurationError)
    }
  )

  it.each(['markdown', 'text', 'speech'] as const)('resolves the %s preset', (preset) => {
    const resolved = resolveResponse(preset)

    expect(resolved.instructions.length).toBeGreaterThan(0)
    expect(resolved).toEqual(resolveResponse({ preset }))
  })

  it('extends preset instructions', () => {
    const response = resolveResponse({
      preset: 'speech',
      instructions: 'Use one short sentence.',
    })

    expect(response.instructions).toContain('text-to-speech')
    expect(response.instructions).toContain('Use one short sentence.')
  })

  it('supports fully custom instructions without inherited preset guidance', () => {
    expect(resolveResponse({ instructions: 'Write a haiku.' })).toEqual({
      instructions: 'Write a haiku.',
    })
  })

  it('keeps text callbacks separate from response guidance without invoking them', () => {
    const handler = vi.fn()
    const onDelta = vi.fn()
    const resolved = resolveResponse({ handler, onDelta })

    expect(resolved.instructions).toBe(resolveResponse('markdown').instructions)
    expect(resolved.handler).toBe(handler)
    expect(resolved.onDelta).toBe(onDelta)
    expect(handler).not.toHaveBeenCalled()
    expect(onDelta).not.toHaveBeenCalled()
  })

  it.each([
    null,
    [],
    'unknown',
    { preset: 'unknown' },
    { preset: ['speech'] },
    { instructions: '' },
    { instructions: 42 },
    { examples: ['Removed examples'] },
    { handler: true },
    { onDelta: 'not a callback' },
    { unexpected: true },
  ])('rejects invalid response settings: %j', (response) => {
    expect(() => resolveResponse(response as Response)).toThrow(InvalidConfigurationError)
  })
})

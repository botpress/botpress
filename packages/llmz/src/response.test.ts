import { describe, expect, it, vi } from 'vitest'
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
      expect(() => new Chat(options as never)).toThrow(TypeError)
    }
  )

  it.each(['markdown', 'text', 'speech'] as const)('resolves the %s preset with examples', (preset) => {
    const resolved = resolveResponse(preset)

    expect(resolved.instructions.length).toBeGreaterThan(0)
    expect(resolved.examples.length).toBeGreaterThan(0)
    expect(resolved).toEqual(resolveResponse({ preset }))
  })

  it('extends preset instructions and replaces its examples', () => {
    const response = resolveResponse({
      preset: 'speech',
      instructions: 'Use one short sentence.',
      examples: ['Ready.'],
    })

    expect(response.instructions).toContain('text-to-speech')
    expect(response.instructions).toContain('Use one short sentence.')
    expect(response.examples).toEqual(['Ready.'])
    expect(resolveResponse({ preset: 'markdown', examples: [] }).examples).toEqual([])
  })

  it('supports fully custom instructions without inherited preset guidance', () => {
    expect(resolveResponse({ instructions: 'Write a haiku.', examples: ['An illustrative haiku.'] })).toEqual({
      instructions: 'Write a haiku.',
      examples: ['An illustrative haiku.'],
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

  it('copies examples so configuration changes cannot alter an active generation', () => {
    const examples = ['Original example.']
    const resolved = resolveResponse({ preset: 'text', examples })
    examples[0] = 'Changed later.'
    resolved.examples.push('Only this resolved configuration.')

    expect(resolved.examples[0]).toBe('Original example.')
    expect(resolveResponse('text').examples).not.toContain('Only this resolved configuration.')
  })

  it.each([
    null,
    [],
    'unknown',
    { preset: 'unknown' },
    { preset: ['speech'] },
    { instructions: '' },
    { instructions: 42 },
    { examples: 'not an array' },
    { examples: [''] },
    { examples: [42] },
    { handler: true },
    { onDelta: 'not a callback' },
    { unexpected: true },
  ])('rejects invalid response settings: %j', (response) => {
    expect(() => resolveResponse(response as Response)).toThrow(TypeError)
  })
})

import { beforeAll, describe, expect, it, vi } from 'vitest'

import { createInspector, type InspectEvent } from './inspection.js'
import { truncate } from './truncate.js'
import { getTokenizer, init } from './utils.js'

beforeAll(async () => {
  await init()
})

describe('shared prompt inspection', () => {
  it('supplies display purpose, runtime identity, and the effective override budget', () => {
    const onInspect = vi.fn(() => 'Formatted evidence')
    const inspector = createInspector(onInspect)
    const value = { body: 'Full evidence' }
    const identity = { sessionId: 'session-1', turn: 2, iteration: 3, tool: 'search' }

    expect(
      inspector(truncate({ value, maxTokens: 40000, preserve: 'both' }), {
        purpose: 'result',
        maxTokens: 2000,
        identity,
      })
    ).toBe('Formatted evidence')
    expect(onInspect).toHaveBeenCalledWith({
      value,
      purpose: 'result',
      maxTokens: 40000,
      preserve: 'both',
      compact: false,
      identity,
    })
  })

  it('uses the default multiline formatter when the hook returns undefined', () => {
    const inspector = createInspector(() => undefined)
    const document = '# Evidence\n\nFirst paragraph.\n\nSecond paragraph.'

    expect(inspector(document, { purpose: 'result', maxTokens: 2000 })).toBe(document)
  })

  it.each(['top', 'bottom', 'both'] as const)(
    'enforces the supplied budget on custom text preserving %s',
    (preserve) => {
      const inspector = createInspector(() => 'START\n' + '🧠漢字 evidence '.repeat(10000) + '\nEND')
      const output = inspector(truncate({ value: 'source', maxTokens: 40, preserve }), {
        purpose: 'result',
        maxTokens: 2000,
      })

      expect(getTokenizer().count(output)).toBeLessThanOrEqual(40)
      expect(output).toContain('[truncated]')
      expect(output).not.toContain('\uFFFD')
      expect(output.includes('START')).toBe(preserve !== 'bottom')
      expect(output.includes('END')).toBe(preserve !== 'top')
    }
  )

  it('keeps inventories and diagnostic previews fixed even when their values contain overrides', () => {
    const events: InspectEvent[] = []
    const inspector = createInspector((event) => {
      events.push(event)
      return 'custom '.repeat(5000)
    })
    const value = truncate({ value: 'Full value', maxTokens: 40000 })
    const output = inspector(value, {
      purpose: 'variable',
      maxTokens: 60,
      compact: true,
      identity: { variable: 'answer' },
    })

    expect(events[0]?.maxTokens).toBe(60)
    expect(events[0]?.value).toBe('Full value')
    expect(getTokenizer().count(output)).toBeLessThanOrEqual(60)
  })

  it('isolates hook values and metadata from runtime state', () => {
    const value = { account: { name: 'Maya' } }
    const identity = { variable: 'account' }
    const inspector = createInspector((event) => {
      const displayed = event.value as typeof value
      expect(displayed).not.toBe(value)
      expect(Reflect.set(displayed.account, 'name', 'Changed')).toBe(false)
      expect(Reflect.set(event.identity!, 'variable', 'changed')).toBe(false)
      return 'Safe custom output'
    })

    expect(inspector(value, { purpose: 'variable', maxTokens: 60, identity })).toBe('Safe custom output')
    expect(value.account.name).toBe('Maya')
    expect(identity.variable).toBe('account')
  })

  it('does not invoke accessors while preparing custom hook input', () => {
    const getter = vi.fn(() => {
      throw new Error('Do not read')
    })
    const value = Object.defineProperty({}, 'secret', { get: getter, enumerable: true })
    const inspector = createInspector((event) => {
      expect(event.value).toEqual({ secret: '[Getter]' })
      return 'Custom preview'
    })

    expect(inspector(value, { purpose: 'result', maxTokens: 60 })).toBe('Custom preview')
    expect(getter).not.toHaveBeenCalled()
  })

  it('falls back to the default formatter when a custom hook fails', () => {
    const inspector = createInspector(() => {
      throw new Error('Formatter failed')
    })

    expect(inspector({ answer: 42 }, { purpose: 'variable', maxTokens: 60, compact: true })).toBe('{ answer: 42 }')
  })

  it('enforces a zero budget on custom output', () => {
    const inspector = createInspector(() => 'Must not be displayed')

    expect(inspector('value', { purpose: 'result', maxTokens: 0 })).toBe('')
  })
})

import type { CognitiveToolCall } from '@botpress/cognitive'
import { describe, expect, it } from 'vitest'
import { RUN_JAVASCRIPT_TOOL, validateNativeToolCalls } from './native-tools.js'

const call = (name: string, input: Record<string, unknown> = {}, id = name) => ({ id, name, input })

describe('single native execution tool', () => {
  it('documents one JavaScript tool and refers to the system syntax section', () => {
    expect(RUN_JAVASCRIPT_TOOL.name).toBe('run_javascript')
    expect(RUN_JAVASCRIPT_TOOL.description).toContain('"run_javascript syntax"')
    expect(RUN_JAVASCRIPT_TOOL.parameters).toMatchObject({
      type: 'object',
      required: ['code'],
      additionalProperties: false,
    })
  })

  it('accepts ordinary text or one complete JavaScript program', () => {
    expect(validateNativeToolCalls([])).toEqual({ valid: true })
    expect(validateNativeToolCalls([call('run_javascript', { code: 'return inspect(42)' })])).toEqual({
      valid: true,
      call: { id: 'run_javascript', code: 'return inspect(42)' },
    })
  })

  it.each([
    [
      call('run_javascript', { code: 'return inspect(1)' }, 'a'),
      call('run_javascript', { code: 'return inspect(2)' }, 'b'),
    ],
    [
      call('run_javascript', { code: 'return inspect(1)' }, 'same'),
      call('run_javascript', { code: 'return inspect(2)' }, 'same'),
    ],
    [call('run_javascript', { code: 'return inspect(1)' }, '')],
    [call('run_javascript', { code: '   ' })],
    [call('run_javascript', { code: 'return inspect(1)', ignored: true })],
    [call('run_javascript', {})],
    [call('listen')],
    [call('exit_done', { count: 2 })],
    [call('show_button', { label: 'First' })],
  ])('rejects the entire invalid response before dispatch: %j', (...calls) => {
    const result = validateNativeToolCalls(calls)

    expect(result.valid).toBe(false)
    expect(result).not.toHaveProperty('call')

    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it.each([null, [], 'return inspect(1)', 42])('rejects non-object arguments: %j', (input) => {
    const invalid = { id: 'call-1', name: 'run_javascript', input } as unknown as CognitiveToolCall
    expect(validateNativeToolCalls([invalid])).toMatchObject({ valid: false })
  })
})

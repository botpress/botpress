import type { CognitiveToolCall } from '@botpress/cognitive'
import { describe, expect, it } from 'vitest'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, javascript, response } from './fixtures/native-client.js'
import { getRunJavaScriptTool, RUN_JAVASCRIPT_TOOL, validateNativeToolCalls } from './native-tools.js'

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
    expect(RUN_JAVASCRIPT_TOOL.parameters).not.toHaveProperty('properties.code.minLength')
  })

  it('keeps execution documentation in both modes without teaching workers to send text', () => {
    const chat = getRunJavaScriptTool(true)
    const worker = getRunJavaScriptTool(false)
    for (const tool of [chat, worker]) {
      expect(tool.description).toContain('business functions are called INSIDE its code')
      expect(tool.description).toContain('never submit search terms')
      expect(tool.parameters).toEqual(chat.parameters)
    }

    expect(chat.description).toContain('include the assistant text AND this tool call')
    expect(worker.description).toContain('Keep assistant text empty')
    expect(worker.description).not.toContain('include the assistant text')
    expect(worker.description).not.toContain('A plain assistant reply')
  })

  it('executes the JavaScript example embedded in the code property documentation', async () => {
    const schema = RUN_JAVASCRIPT_TOOL.parameters as {
      properties: { code: { description: string } }
    }
    const code = schema.properties.code.description.match(/<example[^>]*>([\s\S]*?)<\/example>/)?.[1]
    expect(code).toBeDefined()
    const result = await executeContext({
      client: new NativeClient([javascript(code!), response('42')]),
      chat: createRecordingChat({ handler: () => {} }),
      options: { loop: 2 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(result.session.memory.variables.total).toBe(42)
    expect(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
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

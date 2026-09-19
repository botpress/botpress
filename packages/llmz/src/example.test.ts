import { z } from '@bpinternal/zui'
import { parse } from 'acorn'
import { describe, expect, it } from 'vitest'
import { DefaultComponents } from './component.default.js'
import { Example, type ExampleDefinition } from './example.js'
import { Exit } from './exit.js'
import { renderNativeExamples } from './prompts/native.js'

const listen = new Exit({ name: 'listen', description: 'Wait for the user' })
const components = [DefaultComponents.Text, DefaultComponents.Button, DefaultComponents.Image]

describe('structured native examples', () => {
  it('accepts normal assistant text without an explicit exit', () => {
    const example = new Example({
      situation: 'The user greets you.',
      messages: [{ component: DefaultComponents.Text, body: 'Hello!' }],
    })
    const rendered = renderNativeExamples([example], components, [listen])
    expect(rendered).toContain('{"text":"Hello!"}')
    expect(rendered).not.toContain('toolCalls')
  })

  it('treats former protocol symbols as ordinary text and JavaScript string content', () => {
    const text = new Example({
      situation: 'Copy the text verbatim.',
      messages: [{ component: 'message', body: '■next=listen' }],
    })
    const code = new Example({ situation: 'Return a literal string.', code: 'return "■next=listen"' })
    expect(renderNativeExamples([text, code], components, [listen])).toContain('■next=listen')
  })

  it('copies mutable argument data when constructing a demonstration', () => {
    const props = { label: 'Original' }
    const example = new Example({
      situation: 'Offer a choice.',
      messages: [{ component: DefaultComponents.Button, props }],
      exit: listen,
    })
    props.label = 'Changed later'
    expect(renderNativeExamples([example], components, [listen])).toContain('Original')
    expect(renderNativeExamples([example], components, [listen])).not.toContain('Changed later')
  })

  it('validates JavaScript syntax without executing it', () => {
    const example = new Example({
      situation: 'Run independent searches.',
      code: 'return await Promise.all([search({ query: "one" }), search({ query: "two" })])',
    })
    expect(example.definition.code).toContain('Promise.all')
    expect(() => new Example({ situation: 'Invalid TypeScript', code: 'const total: number = 1' })).toThrow()
  })

  it.each([
    { situation: '', code: 'return 1' },
    { situation: 'Empty code', code: '' },
    { situation: 'No response' },
    { situation: 'No response', messages: [] },
    { situation: 'Simulated history', code: 'return 1', result: 1 },
    { situation: 'Multiple iterations', iterations: [] },
    { situation: 'Bad name', exit: 'not valid' },
    { situation: 'Bad props', messages: [{ component: 'button', props: [] }] },
    { situation: 'Bad value', exit: listen, props: { value: () => 1 } },
  ])('rejects invalid structured examples: $situation', (definition) => {
    expect(() => new Example(definition as unknown as ExampleDefinition)).toThrow()
  })

  it('validates active component and exit schemas before including examples', () => {
    const invalid = new Example({
      situation: 'Display an image.',
      messages: [{ component: 'image', props: { url: 42 } }],
      exit: listen,
    })
    expect(() => renderNativeExamples([invalid], components, [listen])).toThrow(/Invalid native example/)
    const missing = new Example({
      situation: 'Display an unknown component.',
      messages: [{ component: 'missing', body: 'Hi' }],
    })
    expect(() => renderNativeExamples([missing], components, [listen])).toThrow(/Unknown native example component/)
  })

  it('returns primitive typed exit payloads from JavaScript without a native wrapper', () => {
    const total = new Exit({ name: 'total', description: 'Computed total', schema: z.number().int() })
    const example = new Example({ situation: 'The verified total is 42.', exit: total, props: 42 })
    expect(renderNativeExamples([example], [], [total])).toContain('return exit(\\"total\\", 42)')
  })

  it('combines code, presentation, and completion without hiding captured declarations in a function', () => {
    const example = new Example({
      situation: 'Show a choice, load an account, and finish',
      messages: [{ component: 'Button', props: { label: 'Continue' } }],
      code: 'const account = await readAccount(); return account;',
      exit: listen,
    })
    const rendered = renderNativeExamples([example], components, [listen])
    const response = JSON.parse(rendered.split('\n').at(-1)!)
    const code = response.toolCalls[0].arguments.code as string
    const program = parse(code, {
      ecmaVersion: 'latest',
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    })

    expect(response.toolCalls).toHaveLength(1)
    expect(code).toContain('await chat.send')
    expect(code).toContain('const account = await readAccount()')
    expect(code).toContain('return exit("listen")')
    expect(program.body.some((node) => node.type === 'VariableDeclaration')).toBe(true)
    expect(code).not.toContain('async () =>')
  })

  it('only changes program returns when appending a structured completion', () => {
    const example = new Example({
      situation: 'Complete after evaluating nested code',
      code: 'const read = () => { return 3 }; if (read()) { return read() }',
      exit: listen,
    })
    const rendered = renderNativeExamples([example], components, [listen])
    const response = JSON.parse(rendered.split('\n').at(-1)!)
    const code = response.toolCalls[0].arguments.code as string

    expect(code).toContain('const read = () => { return 3 }')
    expect(code).toContain('(read());')
    expect(() =>
      parse(code, {
        ecmaVersion: 'latest',
        allowReturnOutsideFunction: true,
      })
    ).not.toThrow()
  })

  it('awaits the original returned promise before a structured exit', () => {
    const example = new Example({
      situation: 'Wait for saving to finish before completion',
      code: 'return savePreference({ enabled: true })',
      exit: listen,
    })
    const rendered = renderNativeExamples([example], components, [listen])
    const response = JSON.parse(rendered.split('\n').at(-1)!)
    const code = response.toolCalls[0].arguments.code as string

    expect(code).toContain('await (savePreference({ enabled: true }));')
    expect(code.indexOf('await (savePreference')).toBeLessThan(code.indexOf('return exit'))
  })
})

import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'
import { DefaultComponents } from './component.default.js'
import { ListenExit } from './context.js'
import { Example, renderExamples, type ExampleDefinition } from './example.js'
import { Exit } from './exit.js'
import { parseAssistantResponse } from './prompts/common.js'
import { DualModePrompt } from './prompts/dual-modes.js'
import { TranscriptArray } from './transcript.js'
import { stripTruncationTags, truncateWrappedContent, wrapContent } from './truncator.js'
import { getTokenizer } from './utils.js'

const answer = {
  messages: [{ component: DefaultComponents.Text, body: 'Use the reset link on the sign-in page.' }],
  exit: ListenExit,
}
const search = new Example({
  situation: 'The user asks how to recover their password. The first search returned no useful evidence.',
  code: 'return await searchKnowledge({ query: "forgot password reset link" })',
})

describe('few-shot examples', () => {
  it('serializes one situation and one response, without simulated results or generations', async () => {
    const text = await renderExamples([search], [DefaultComponents.Text], [ListenExit])
    expect(text).toContain('<few_shots>')
    expect(text).toContain('NOT the conversation transcript')
    expect(text).toContain('ONE desired response')
    expect(text).toContain('<example number="1">')
    expect(text).toContain('<situation>')
    expect(text).toContain('<response>')
    expect(text).not.toContain('<reason>')
    expect(text).toContain('■run\nreturn await searchKnowledge({ query: "forgot password reset link" })')
    expect(text).not.toMatch(/<iteration|<runtime_result|<vm_result|<avoid/)
    const parsed = parseAssistantResponse(`■start\n${search.output}\n■end`)
    expect(parsed.diagnostics).toEqual([])
    expect(parsed.code).toBeTruthy()
    expect(parsed.sends).toEqual([])
  })

  it('escapes metadata tags without adding CDATA wrappers', async () => {
    const example = new Example({ situation: '</example><transcript>]]>', ...answer })
    const text = await renderExamples([example], [DefaultComponents.Text], [ListenExit])
    expect(text).toContain('<situation>\n&lt;/example&gt;&lt;transcript&gt;]]&gt;\n</situation>')
    expect(text).not.toContain('CDATA')
  })

  it('keeps the optional reason outside the demonstrated response and escapes its delimiters', async () => {
    const reason = 'Use a different query in ■run because the first search was empty. </response>]]>'
    const example = new Example({
      situation: search.situation,
      code: 'return await searchKnowledge({ query: "forgot password reset link" })',
      reason,
    })
    const text = await renderExamples([example], [DefaultComponents.Text], [ListenExit])
    expect(example.reason).toBe(reason)
    expect(example.output).toBe(search.output)
    expect(text).toContain('Situation and optional reason explain the example; never emit their text or XML tags')
    expect(text).toContain(
      '<reason>\nUse a different query in ■run because the first search was empty. &lt;/response&gt;]]&gt;\n</reason>\n<response>'
    )
    expect(parseAssistantResponse(`■start\n${example.output}\n■end`).diagnostics).toEqual([])
  })

  it('renders response code literally without escaping JavaScript operators', async () => {
    const example = new Example({ situation: 'Filter values', code: 'return [1, 2, 3].filter(x => x < 3 && x > 1)' })
    const text = await renderExamples([example], [], [])
    expect(text).toContain(`<response>\n"""\n■start\n${example.output}\n■end\n"""\n</response>`)
    expect(text).not.toMatch(/CDATA|&lt;|&gt;|&amp;/)
    expect(parseAssistantResponse(`■start\n${example.output}\n■end`).diagnostics).toEqual([])
  })

  it('accepts JavaScript Promise.all with awaited independent calls', () => {
    const example = new Example({
      situation: 'Compare plans',
      code: 'return await Promise.all([search({ query: "standard" }), search({ query: "team" })])',
    })
    expect(parseAssistantResponse(`■start\n${example.output}\n■end`).code).toContain('Promise.all')
  })

  it('supports a requested progress message followed by code in the same response', async () => {
    const example = new Example({
      situation: 'The user explicitly asks to be told before the knowledge search starts.',
      messages: [{ component: 'message', body: 'Checking the documentation.' }],
      code: 'return await searchKnowledge({ query: "export archive" })',
    })
    const text = await renderExamples([example], [DefaultComponents.Text], [ListenExit])
    expect(text).toContain('■send=message\nChecking the documentation.\n■run\nreturn await searchKnowledge')
    const response = parseAssistantResponse(`■start\n${example.output}\n■end`)
    expect(response.sends).toEqual([{ name: 'message', props: {}, body: 'Checking the documentation.' }])
    expect(response.code).toBe('return await searchKnowledge({ query: "export archive" })')
    expect(response.diagnostics).toEqual([])
  })

  it.each([
    { code: 'const count: number = 1' },
    { code: 'return "■next=done"' },
    { code: '' },
    { code: 'await searchKnowledge({ query: "test" })', result: [] },
    { exit: 'listen', messages: [{ component: 'message', body: 'Hello ■next=listen' }] },
    { exit: 'listen', messages: [{ component: 'bad name', body: 'Hello' }] },
    { exit: 'listen', props: { value: '■send=message' } },
    { code: 'return 1', exit: 'listen' },
    { messages: [{ component: 'message', body: 'Hello' }] },
  ])('rejects invalid protocol or code when constructing an example: %j', (iteration) => {
    expect(() => new Example({ situation: 'Input', ...iteration } as ExampleDefinition)).toThrow()
  })

  it('requires a situation and rejects simulated results or multiple iterations', () => {
    expect(() => new Example({ situation: '', ...answer })).toThrow(/non-empty situation/)
    expect(() => new Example({ situation: 'Input' } as ExampleDefinition)).toThrow(/code or an exit/)
    expect(() => new Example({ situation: 'Input', code: 'return 1', result: 1 } as ExampleDefinition)).toThrow(
      /one response/
    )
    expect(() => new Example({ situation: 'Input', iterations: [answer] } as unknown as ExampleDefinition)).toThrow(
      /one response/
    )
  })

  it('checks the active catalog, required props, types, and body support', async () => {
    for (const message of [
      { component: 'missing', body: 'Hello' },
      { component: 'image' },
      { component: 'image', props: { url: 12 } },
      { component: 'image', props: { url: 'https://example.com/photo.jpg' }, body: 'Not allowed' },
      { component: 'message' },
    ]) {
      const example = new Example({ situation: 'Input', messages: [message], exit: ListenExit })
      await expect(
        renderExamples([example], [DefaultComponents.Text, DefaultComponents.Image], [ListenExit])
      ).rejects.toThrow(/Invalid few-shot message/)
    }
    await expect(renderExamples([new Example({ situation: 'Reply', ...answer })], [], [ListenExit])).rejects.toThrow(
      /Invalid few-shot message/
    )
  })

  it('checks exit names and schemas, including worker mode', async () => {
    const done = new Exit({ name: 'done', description: 'Complete', schema: z.object({ count: z.number() }) })
    const valid = new Example({ situation: 'Count records', exit: done, props: { count: 2 } })
    expect(await renderExamples([valid], [], [done])).toContain('■next=done {"count":2}')
    await expect(renderExamples([valid], [], [ListenExit])).rejects.toThrow(/Unknown few-shot exit/)
    const invalid = new Example({ situation: 'Count', exit: done, props: { count: 'two' } })
    await expect(renderExamples([invalid], [], [done])).rejects.toThrow(/Invalid few-shot exit/)
  })

  it.each([true, false])('places examples outside the transcript in chat=%s mode', async (chat) => {
    const examples = chat ? [search] : [new Example({ situation: 'Add numbers', code: 'return 2 + 8' })]
    const transcript = new TranscriptArray([{ role: 'user', name: 'user', content: 'LIVE_INPUT' }])
    const props = {
      instructions: 'Follow the task.',
      examples,
      transcript,
      objects: [],
      globalTools: [],
      components: chat ? [DefaultComponents.Text] : [],
      exits: [ListenExit],
    }
    const { message, parts } = await DualModePrompt.getSystemMessage(props)
    const text = String(message.content)
    expect(text).toContain('<few_shots>')
    // Keep demonstrations close to generation, but outside both instructions and live history.
    expect(text.indexOf('</few_shots>')).toBeLessThan(text.indexOf('# Your task'))
    expect(text.indexOf('</few_shots>')).toBeLessThan(text.indexOf('# Response format'))
    if (chat) {
      expect(text.indexOf('<few_shots>')).toBeGreaterThan(text.indexOf('LIVE_INPUT'))
    }
    expect(parts.transcript).not.toContain('password recovery')
    expect(parts.examples).toContain('<few_shots>')
    expect(transcript).toHaveLength(1)
    const initial = await DualModePrompt.getInitialUserMessage(props)
    expect(String(initial.content)).not.toContain('<few_shots>')
  })

  it('omits the section when unused and keeps demonstrations intact under truncation', async () => {
    expect(await renderExamples([], [], [])).toBe('')
    const examples = await renderExamples([search], [DefaultComponents.Text], [ListenExit])
    const text = `${examples}\n${wrapContent('Disposable text. '.repeat(3000))}`
    const messages = truncateWrappedContent({
      messages: [{ role: 'system' as const, content: text }],
      tokenLimit: getTokenizer().count(examples) + 100,
    })
    expect(messages[0]!.content).toContain(examples)
    expect(String(messages[0]!.content).length).toBeLessThan(stripTruncationTags(text).length)
  })
})

import { z } from '@bpinternal/zui'
import { describe, expect, it, vi } from 'vitest'
import { Component } from '../chat/component.js'
import { Exit } from '../exit.js'
import { executeContext } from '../runtime/execute.js'
import { createRecordingChat } from '../runtime/fixtures/chat.js'
import { NativeClient, javascript, nativeCall, response } from '../runtime/fixtures/native-client.js'
import { validateNativeToolCalls } from '../runtime/native-tools.js'
import { Tool } from '../tool.js'
import { getNativeExamples } from './native-examples.js'

const all = { chat: true, tools: true, components: true, exits: true, listen: true }
const examples = (text: string) =>
  [...text.matchAll(/<example name="([^"]+)">([\s\S]*?)<\/example>/g)].map((match) => ({
    name: match[1]!,
    content: match[2]!,
  }))

describe('native examples', () => {
  it.each([true, false])('keeps examples capability-aware (chat=%s)', (chat) => {
    for (const tools of [true, false]) {
      for (const exits of [true, false]) {
        for (const components of [true, false]) {
          const text = getNativeExamples({ chat, tools, exits, components, listen: exits })
          expect(text.includes('name="search_then_use_the_result"')).toBe(tools)
          expect(text.includes('name="complete_with_a_typed_result"')).toBe(exits)
          expect(text.includes('name="text_and_buttons_in_the_same_response"')).toBe(chat && components && exits)
          expect(text.includes('<assistant_text>')).toBe(chat)
          expect(text).not.toContain('■')
          expect(text).not.toContain('<![CDATA[')
          expect(text).not.toContain('&quot;')
        }
      }
    }

    expect(getNativeExamples({ ...all, listen: false })).not.toContain("exit('listen')")
  })

  it('renders native arguments as valid JSON and keeps prose outside the code', () => {
    for (const { content } of examples(getNativeExamples(all))) {
      for (const match of content.matchAll(/<assistant_turn>([\s\S]*?)<\/assistant_turn>/g)) {
        const argumentsText = match[1]!.match(/<arguments>\s*([\s\S]*?)\s*<\/arguments>/)?.[1]
        if (!argumentsText) {
          continue
        }

        const args = JSON.parse(argumentsText)
        expect(Object.keys(args)).toEqual(['code'])
        expect(validateNativeToolCalls([nativeCall('run_javascript', args)]).valid).toBe(true)
        expect(args.code).not.toMatch(/<assistant_text>|<arguments>/)
      }
    }
  })

  // Execute the documented programs through the real compiler, VM, inspector and validators.
  // Only the fictional business implementations and model responses are stubbed.
  it.each(examples(getNativeExamples(all)))('executes the $name demonstration', async ({ name, content }) => {
    const search = vi.fn(async (query: string) =>
      query === 'blue mugs' ? 'Blue mugs are available. Price: $12 each.' : 'Red mugs are available.'
    )
    const stock = vi.fn(async () => ({ count: 3 }))
    const price = vi.fn(async () => ({ amount: 12 }))
    const deliver = vi.fn()
    const complete = new Exit({
      name: 'example_complete',
      description: 'Finish the example.',
      schema: z.object({ total: z.number() }),
    })
    const responses = [...content.matchAll(/<assistant_turn>([\s\S]*?)<\/assistant_turn>/g)].map((match) => {
      const text = match[1]!.match(/<assistant_text>\n([\s\S]*?)\n<\/assistant_text>/)?.[1] ?? ''
      const argumentsText = match[1]!.match(/<arguments>\s*([\s\S]*?)\s*<\/arguments>/)?.[1]
      return response(text, argumentsText ? [nativeCall('run_javascript', JSON.parse(argumentsText))] : undefined)
    })
    // Single-turn inspection examples deliberately leave the task open for a later response.
    const result = await executeContext({
      client: new NativeClient([...responses, javascript("return exit('example_complete', { total: 42 });")]),
      chat: createRecordingChat({
        handler: deliver,
        components: [
          new Component({
            name: 'exampleChoices',
            description: 'Fictional choices.',
            props: z.object({ options: z.array(z.object({ label: z.string(), value: z.string() })) }),
          }),
        ],
      }),
      tools: [
        new Tool({ name: 'exampleSearch', input: z.string(), output: z.string(), handler: search }),
        new Tool({ name: 'exampleReadStock', input: z.object({ itemId: z.literal('MUG-7') }), handler: stock }),
        new Tool({ name: 'exampleReadPrice', input: z.object({ itemId: z.literal('MUG-7') }), handler: price }),
      ],
      exits: [complete],
      options: { loop: 3 },
    })
    expect(result.isSuccess(), result.isError() ? result.error.message : result.status).toBe(true)
    expect(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
    if (name === 'search_then_use_the_result') {
      expect(search).toHaveBeenCalledTimes(1)
      expect(search.mock.calls[0]?.[0]).toBe('blue mugs')
      expect(deliver.mock.calls[0]?.[0]).toEqual({ type: 'text', text: 'Blue mugs are available for $12 each.' })
      expect(result.session.memory.variables.products).toBe('Blue mugs are available. Price: $12 each.')
    } else if (name === 'repair_a_search_phrase_submitted_as_code') {
      expect(search).toHaveBeenCalledTimes(1)
      expect(search.mock.calls[0]?.[0]).toBe('red mugs')
    } else if (name === 'object_arguments_and_independent_calls') {
      expect(stock).toHaveBeenCalledTimes(1)
      expect(price).toHaveBeenCalledTimes(1)
      expect(result.session.memory.variables.stock).toEqual({ count: 3 })
      expect(result.session.memory.variables.price).toEqual({ amount: 12 })
    } else if (name === 'text_and_buttons_in_the_same_response') {
      expect(deliver.mock.calls.map(([message]) => message.type)).toEqual(['text', 'component'])
      expect(result.iterations).toHaveLength(1)
    } else if (name === 'complete_with_a_typed_result') {
      expect(result.is(complete)).toBe(true)
      expect(result.output).toEqual({ total: 42 })
      expect(deliver).not.toHaveBeenCalled()
    } else if (name === 'execute_and_inspect') {
      expect(result.session.memory.variables.total).toBe(42)
    }
  })
})

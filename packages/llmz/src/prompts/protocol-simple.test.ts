import { describe, expect, it } from 'vitest'
import { DefaultComponents } from '../component.default.js'
import { ListenExit } from '../context.js'
import { Exit } from '../exit.js'
import { Transcript, TranscriptArray } from '../transcript.js'
import { parseAssistantResponse } from './common.js'
import { DualModePrompt } from './dual-modes.js'
import { getProtocolSections } from './protocol.js'

describe('plain-language protocol specifications', () => {
  it.each<Transcript.Message>([
    { role: 'user', content: 'TASK_INPUT' },
    { role: 'assistant', content: 'TASK_INPUT' },
    { role: 'user', content: 'TASK_INPUT', modality: 'voice' },
    { role: 'user', content: 'TASK_INPUT', attachments: [{ type: 'audio', url: 'https://example.com/input.wav' }] },
  ])('describes worker history as task input, including $role / $modality', async (record) => {
    const message = await DualModePrompt.getInitialUserMessage({
      components: [],
      exits: [new Exit({ name: 'done', description: 'Finish the task.' })],
      objects: [],
      globalTools: [],
      instructions: 'Compute the requested total.',
      transcript: new TranscriptArray([record]),
    })
    const text = JSON.stringify(message.content)
    expect(text).toContain('TASK_INPUT')
    expect(text).not.toMatch(/spoke|what (?:you|they) said|voice message|conversation|■send/i)
    if ('attachments' in record) expect(text).toContain('https://example.com/input.wav')
  })

  it.each([true, false])('explains boundaries, commands and complete patterns (chat=%s)', (chat) => {
    const sections = getProtocolSections({
      components: chat ? [DefaultComponents.Text] : [],
      exits: [chat ? ListenExit : new Exit({ name: 'done', description: 'Finish the task.' })],
    })
    expect(sections.specifications).toContain('## Response Boundaries')
    expect(sections.specifications).toContain('## Available Commands')
    expect(sections.specifications).toContain('## Command Patterns')
    expect(sections.specifications).toContain('Do NOT start or end your response with """')
    expect(sections.specifications).toContain('return total')
    expect(sections.specifications).toContain('Do not add ■next after return')
  })

  it.each([DefaultComponents.Text, DefaultComponents.Card, DefaultComponents.Button])(
    'every chat pattern is valid as written: $definition.name',
    (component) => {
      const spec = getProtocolSections({ components: [component], exits: [ListenExit] }).specifications
      const patterns = spec.split('## Command Patterns')[1] ?? ''
      const examples = [...patterns.matchAll(/^"""\n([\s\S]*?)\n"""$/gm)]
      expect(examples).toHaveLength(7)
      for (const [, raw] of examples) {
        const parsed = parseAssistantResponse(raw!)
        expect(parsed.diagnostics, raw).toEqual([])
        if (parsed.code?.includes('return')) expect(parsed.next).toBeUndefined()
      }
    }
  )

  it('keeps worker instructions free of chat references in every generation stage', async () => {
    const props = {
      components: [],
      exits: [new Exit({ name: 'done', description: 'Finish the task.' })],
      objects: [],
      globalTools: [],
      transcript: new TranscriptArray(),
      instructions: 'Compute the requested total.',
      iteration: { current: 1, limit: 3 },
    }
    const messages = [
      (await DualModePrompt.getSystemMessage(props)).message,
      await DualModePrompt.getInitialUserMessage(props),
      await DualModePrompt.getThinkingMessage({ isChatEnabled: false, variables: { total: 4 } }),
      await DualModePrompt.getInvalidCodeMessage({
        isChatEnabled: false,
        code: 'const =',
        message: 'Invalid JavaScript',
      }),
      await DualModePrompt.getCodeExecutionErrorMessage({
        isChatEnabled: false,
        message: 'Tool failed',
        stacktrace: '',
        variables: {},
      }),
    ]
    for (const current of [1, 2, 3])
      messages.push({
        role: 'user',
        content: DualModePrompt.getExecutionState!({ ...props, iteration: { current, limit: 3 } }),
      })
    for (const message of messages)
      expect(String(message.content)).not.toMatch(
        /■send|\bchat\b|customer|conversation|message types|\blisten(?:ing)?\b|delivered_messages/i
      )
    const spec = getProtocolSections(props).specifications.split('## Command Patterns')[1] ?? ''
    const patterns = [...spec.matchAll(/^"""\n([\s\S]*?)\n"""$/gm)]
    expect(patterns).toHaveLength(3)
    for (const [, raw] of patterns) expect(parseAssistantResponse(raw!).diagnostics, raw).toEqual([])
  })
})

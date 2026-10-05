import { parse } from 'acorn'
import { describe, expect, it } from 'vitest'
import { z } from '@bpinternal/zui'
import { DefaultComponents } from '../component.default.js'
import { ListenExit } from '../context.js'
import { Exit } from '../exit.js'
import { TranscriptArray } from '../transcript.js'
import { parseAssistantResponse } from './common.js'
import { DualModePrompt } from './dual-modes.js'
import { getProtocolSections } from './protocol.js'

const placeholders = /<(?:code|result|command pattern|message|component|props|body|exit)>|\{props\}/
const examples = (text: string) => [...text.matchAll(/^"""\n([\s\S]*?)\n"""$/gm)].map((m) => m[1]!)
const validateCode = (code: string) =>
  parse(code, { ecmaVersion: 'latest', allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true })

const done = new Exit({ name: 'done', description: 'Finish', schema: z.object({ total: z.number() }) })

describe('concrete protocol examples instead of copyable placeholders', () => {
  it.each([
    { label: 'text', components: [DefaultComponents.Text], exits: [ListenExit] },
    { label: 'button only', components: [DefaultComponents.Button], exits: [ListenExit] },
    { label: 'card with fields', components: [DefaultComponents.Card], exits: [done] },
    { label: 'worker', components: [], exits: [done] },
    { label: 'no exits', components: [], exits: [] },
  ])('all $label command patterns parse without any template substitution', async ({ components, exits }) => {
    const props = { components, exits, transcript: new TranscriptArray(), objects: [], globalTools: [] }
    const sections = getProtocolSections(props)
    const patterns = examples(sections.specifications)
    expect(patterns.length).toBeGreaterThan(0)
    for (const raw of patterns) {
      expect(raw).not.toMatch(placeholders)
      const response = parseAssistantResponse(raw)
      expect(response.diagnostics, raw).toEqual([])
      if (response.code) expect(() => validateCode(response.code!)).not.toThrow()
      for (const send of response.sends)
        expect(components.some((c) => c.definition.name.toLowerCase() === send.name)).toBe(true)
      if (response.next) expect(exits.some((exit) => exit.name === response.next!.name)).toBe(true)
    }
    const system = String((await DualModePrompt.getSystemMessage(props)).message.content)
    expect(system).not.toMatch(placeholders)
    expect(system).toContain('Placeholders are an error')
    expect(system).toContain('Write real JavaScript and actual values')
    expect(String((await DualModePrompt.getInitialUserMessage(props)).content)).not.toMatch(placeholders)
  })

  it.each([true, false])('error recovery teaches valid code, not a replacement template (chat=%s)', async (chat) => {
    const message = await DualModePrompt.getInvalidCodeMessage({
      isChatEnabled: chat,
      code: 'const =',
      message: 'Invalid JavaScript',
    })
    const text = String(message.content)
    expect(text).not.toMatch(placeholders)
    expect(text).toContain('Placeholders are an error')
    for (const raw of examples(text)) {
      const response = parseAssistantResponse(raw)
      expect(response.diagnostics).toEqual([])
      if (response.code) expect(() => validateCode(response.code!)).not.toThrow()
    }
  })
})

import { describe, expect, it } from 'vitest'
import { DefaultComponents } from '../component.default.js'
import { ListenExit } from '../context.js'
import { Exit } from '../exit.js'
import { TranscriptArray } from '../transcript.js'
import { runAsyncFunction } from '../vm/index.js'
import { DualModePrompt } from './dual-modes.js'

const getCodeSection = async (chat: boolean) => {
  const { message, parts } = await DualModePrompt.getSystemMessage({
    components: chat ? [DefaultComponents.Text] : [],
    exits: [chat ? ListenExit : new Exit({ name: 'done', description: 'Finish the task.' })],
    instructions: 'Complete the assigned task.',
    transcript: new TranscriptArray(),
    objects: [],
    globalTools: [],
  })
  const code = String(message.content)
    .split('AVAILABLE TOOLS & VARIABLES (■run)')[1]!
    .split(/SECTION \d: AVAILABLE EXITS/)[0]!
  return { code, parts }
}
const snippets = (code: string) =>
  [...code.matchAll(/^"""\n\(\.\.\.\)\n■run\n([\s\S]*?)\n\(\.\.\.\)\n"""$/gm)].map((match) => match[1]!)

describe('short code examples', () => {
  it.each([true, false])('shows five clearly fictional examples in the code section (chat=%s)', async (chat) => {
    const { code, parts } = await getCodeSection(chat)
    expect(snippets(code)).toHaveLength(5)
    expect(code).toContain('fictional tools')
    expect(code).toContain('Do not call these example tools')
    expect(code).toContain('return the actual result')
    expect(code).toContain('not a progress word like "searching"')
    expect(code).toContain('new Date()')
    expect(code).toContain('Promise.all([')
    expect(code).toContain('if (')
    expect(code).toContain('catch (')
    for (const snippet of snippets(code)) {
      expect(snippet).not.toMatch(/■send|■next|■start|■end/)
      expect(parts.protocol).toContain(snippet)
    }
    expect(parts.examples).toBe('')
    expect(parts.tools).not.toContain('exampleSearch')
  })

  it('executes all examples in the real VM, including both branches and caught tool failures', async () => {
    const examples = snippets((await getCodeSection(true)).code)
    expect(examples).toHaveLength(5)
    for (const count of [0, 3]) {
      for (const fails of [false, true]) {
        const context = {
          exampleSearch: async () => ({ passages: ['Actual search result'] }),
          exampleReadAccount: async () => ({ plan: 'Demo' }),
          exampleReadStock: async () => ({ count }),
          exampleReadQuota: async () => ({ remaining: 12 }),
          exampleReadStatus: async () => {
            if (fails) throw new Error('Temporary outage')
            return { status: 'ready' }
          },
        }
        const expected = [
          { passages: ['Actual search result'] },
          { account: { plan: 'Demo' }, checkedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) },
          count ? { available: true, count } : { available: false },
          { account: { plan: 'Demo' }, quota: { remaining: 12 } },
          fails ? { ok: false, error: expect.stringContaining('Temporary outage') } : { status: 'ready' },
        ]
        for (const [index, code] of examples.entries()) {
          const result = await runAsyncFunction(context, code, [])
          expect(result.success).toBe(true)
          if (result.success) expect(result.return_value).toEqual(expected[index])
        }
      }
    }
  })
})

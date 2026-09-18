import { describe, expect, it } from 'vitest'
import { DualModePrompt } from './dual-modes.js'
import { DefaultComponents } from '../component.default.js'
import { ListenExit } from '../context.js'
import { TranscriptArray } from '../transcript.js'
const protocolScenario = (content: string) => ({
  instructions: 'Help visitors choose a plan.',
  components: [DefaultComponents.Text],
  exits: [ListenExit],
  globalTools: [],
  objects: [],
  transcript: new TranscriptArray([{ role: 'user' as const, content }]),
  iteration: { current: 1, limit: 10, resumed: false, deliveredMessages: [] },
})

describe('simple response instructions', () => {
  it('uses ordinary headings, with one final format section after task and history', async () => {
    const props = protocolScenario('Bonjour !')
    const system = String((await DualModePrompt.getSystemMessage(props)).message.content)
    expect(system).not.toMatch(
      /^<\/?(?:response_protocol|message_contract|next_action|conversation_defaults|component|props|body|syntax|exit|assigned_instructions|response_reminder)\b/m
    )
    expect(system.lastIndexOf('# Response format')).toBeGreaterThan(system.indexOf(props.instructions))
    expect(system.lastIndexOf('# Response format')).toBeGreaterThan(system.indexOf('Bonjour !'))
    expect(system).toContain('BAD ❌')
    expect(system).toContain('CORRECT ✅')
  })

  it('puts output format last on every generation, including recovery and the final budget', () => {
    const props = protocolScenario('Hello')
    for (const current of [1, 2, 10]) {
      const state = DualModePrompt.getExecutionState!({
        ...props,
        iteration: { ...props.iteration, current, history: ['Earlier tool returned 17.'] },
      })
      const format = state.lastIndexOf('# Response format')
      expect(format).toBeGreaterThan(state.indexOf('Earlier tool returned 17.'))
      expect(format).toBeGreaterThan(state.indexOf('generation budget'))
      expect(state.trim().endsWith('Begin with ■start. End with ■end.')).toBe(true)
    }
  })
})

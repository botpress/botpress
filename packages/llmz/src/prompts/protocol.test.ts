import { describe, expect, it } from 'vitest'
import { z } from '@bpinternal/zui'
import { Component } from '../component.js'
import { TranscriptArray } from '../transcript.js'
import { DefaultComponents } from '../component.default.js'
import { ListenExit } from '../context.js'
import { ComponentRegistry } from '../message-stream/registry.js'
import { validateComponent } from '../message-stream/validator.js'
import { parseAssistantResponse } from './common.js'
import {
  componentToProtocolDefinition,
  getMessageContract,
  getProtocolInstructions,
  getTextMessageComponent,
} from './protocol.js'
import { DualModePrompt } from './dual-modes.js'

describe('protocol instructions and plain conversation history', () => {
  it('keeps assistant history verbatim while teaching the protocol in instructions', async () => {
    const transcript = new TranscriptArray([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'How can I help?' },
      { role: 'assistant', content: '{"options":["Choose a plan"]}' },
      { role: 'user', content: 'Help me choose a plan' },
    ])
    const props = {
      transcript,
      components: [DefaultComponents.Text],
      exits: [ListenExit],
      objects: [],
      globalTools: [],
    }
    const { message, parts } = await DualModePrompt.getSystemMessage(props)
    expect(parts.transcript).toContain('<assistant-002 role="assistant">\nHow can I help?\n</assistant-002>')
    expect(parts.transcript).toContain('<assistant-003 role="assistant">\n{"options"')
    expect(parts.transcript).not.toContain('■next=listen')
    expect(parts.transcript).not.toContain('■send=')
    expect(parts.transcript).toBe(transcript.toString())
    expect(String(message.content)).not.toContain('Earlier replies have message headers')
    expect(String(message.content).lastIndexOf('# Response format')).toBeGreaterThan(
      String(message.content).indexOf('SECTION 6: CHAT CONVERSATION HISTORY')
    )
    const initial = await DualModePrompt.getInitialUserMessage(props)
    expect(String(message.content)).toContain('BAD ❌')
    expect(String(message.content)).toContain('CORRECT ✅')
    expect(String(initial.content)).not.toContain('BAD ❌')
    expect(String(message.content)).toContain('### Sending a message')
    expect(String(message.content)).toContain('### Running a final action and finishing')
    expect(String(message.content)).toContain('### Sending a message and running code')
    expect(String(initial.content)).toContain('Use ■send=message')
    expect(String(initial.content).trim()).toMatch(/Begin with ■start. End with ■end.$/)
    expect(transcript[1]).toMatchObject({ content: 'How can I help?' })
    expect(transcript.toString()).not.toContain('■send=')
  })

  it('demonstrates the missing-header failure and only valid response shapes afterward', () => {
    const contract = getMessageContract([DefaultComponents.Text], [ListenExit])
    const examples = [...contract.matchAll(/^"""\n([\s\S]*?)\n"""$/gm)].map((match) =>
      parseAssistantResponse(match[1]!)
    )
    expect(examples).toHaveLength(7)
    expect(examples[0]!.sends).toEqual([])
    expect(examples[0]!.diagnostics?.some((d) => d.code === 'invalid-envelope')).toBe(true)
    for (const example of examples.slice(1)) {
      expect(example.diagnostics).toEqual([])
      expect(!!example.code || !!example.next).toBe(true)
      if (example.code?.includes('return')) expect(example.next).toBeUndefined()
    }
    expect(examples[4]!.sends).toHaveLength(1)
    expect(examples[4]!.code).toContain('return total')
    expect(examples[5]!.code).toBe('await exampleSaveTotal({ total: 5 })')
    expect(examples[5]!.next?.name).toBe('listen')
    expect(getMessageContract([DefaultComponents.Text], [])).not.toContain('■next=listen')
  })

  it('uses custom text names and does not invent required props or worker components', () => {
    const reply = new Component({
      name: 'Reply',
      type: 'default',
      aliases: [],
      description: 'Text',
      default: { props: z.object({}), children: [] },
    })
    const addressed = new Component({
      name: 'Addressed',
      type: 'default',
      aliases: [],
      description: 'Addressed text',
      default: { props: z.object({ to: z.string() }), children: [] },
    })
    expect(getTextMessageComponent([addressed, reply])).toBe('reply')
    const contract = getMessageContract([reply], [ListenExit])
    expect(contract).toContain('■send=reply')
    expect(contract).not.toContain('■send=message')
    expect(getMessageContract([addressed], [ListenExit], false)).toContain('include its required fields')
    expect(getMessageContract([], [ListenExit])).not.toContain('■send')
    const transcript = new TranscriptArray([{ role: 'assistant', content: '■send=reply\nAlready framed' }])
    expect(transcript.toString().match(/■send=/g)).toHaveLength(1)
  })
})

describe('default component examples', () => {
  it('shows all three button actions and structured carousel cards', () => {
    const output = getProtocolInstructions({ components: Object.values(DefaultComponents), exits: [ListenExit] })
    expect(output).toContain('■send=button {"action":"say"')
    expect(output).toContain('■send=button {"action":"url"')
    expect(output).toContain('■send=button {"action":"postback"')
    expect(output).toContain('■send=carousel {"cards":[{"title":"Standard plan"')
    expect(output).not.toContain('■send=carousel\n**Standard**')
    expect(output).not.toContain('Let me look')
    expect(output).not.toContain('■next=done')
  })

  it('round-trips every curated example against its actual schema', () => {
    const definitions = Object.values(DefaultComponents).map(componentToProtocolDefinition)
    const registry = new ComponentRegistry(definitions)
    for (const definition of definitions) {
      expect(definition.generation?.examples?.length).toBeGreaterThan(0)
      for (const example of definition.generation!.examples!.flat()) {
        const raw = `■send=${definition.name}${example.props ? ` ${JSON.stringify(example.props)}` : ''}${example.body ? `\n${example.body}` : ''}\n■next=listen`
        const parsed = parseAssistantResponse(`■start\n${raw}\n■end`)
        expect(parsed.diagnostics).toEqual([])
        expect(validateComponent(parsed.sends[0]!, registry)).toMatchObject({ valid: true, errors: [] })
      }
    }
  })

  it('uses the component-owned multi-button example in the combined reference too', () => {
    const components = [DefaultComponents.Button]
    const output = getProtocolInstructions({ components, exits: [ListenExit] })
    const examples = [...output.matchAll(/^"""\n([\s\S]*?)\n"""$/gm)].map((match) => match[1]!)
    const example = examples.find((block) => (block.match(/■send=button/g) ?? []).length === 3)
    expect(example).toBeDefined()
    expect(example).not.toMatch(/■send=message|■next=/)
    const parsed = parseAssistantResponse(`■start\n${example}\n■next=listen\n■end`)
    expect(parsed.diagnostics).toEqual([])
    expect(parsed.sends.map((send) => send.name)).toEqual(['button', 'button', 'button'])
    expect(getProtocolInstructions({ components: [DefaultComponents.Text], exits: [ListenExit] })).not.toContain(
      'Track my order'
    )
  })
})

it('keeps leaf-only and required-prop chat channels distinct from workers', () => {
  const addressed = new Component({
    name: 'Addressed',
    aliases: [],
    type: 'default',
    description: 'Addressed text',
    default: { props: z.object({ to: z.string() }), children: [] },
  })
  for (const components of [[DefaultComponents.Button], [addressed]]) {
    const contract = getMessageContract(components, [ListenExit])
    expect(contract).not.toContain('There is no message channel')
    expect(contract).not.toContain('Immediately after ■start, write ■run or ■next')
    expect(contract).toContain('■send')
  }
  expect(getMessageContract([], [ListenExit])).toContain('Use only ■run or ■next= followed by an available exit name')
})

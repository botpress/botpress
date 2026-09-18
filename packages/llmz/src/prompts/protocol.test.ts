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
  getTranscriptTextComponent,
} from './protocol.js'
import { DualModePrompt } from './dual-modes.js'

describe('message framing in prompts and history', () => {
  it('places a registered message example beside generation and frames assistant history without mutating it', async () => {
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
    expect(parts.transcript).toContain('<assistant-002 role="assistant">\n■send=message\nHow can I help?')
    expect(parts.transcript).toContain('<assistant-003 role="assistant">\n{"options"')
    expect(parts.transcript).not.toContain('■next=listen')
    expect(parts.transcript).not.toContain('■send=message\nHi')
    expect(String(message.content).indexOf('# Response format')).toBeGreaterThan(
      String(message.content).indexOf('# Available response blocks')
    )
    const initial = await DualModePrompt.getInitialUserMessage(props)
    expect(String(message.content)).toContain('BAD ❌')
    expect(String(message.content)).toContain('CORRECT ✅')
    expect(String(initial.content)).not.toContain('BAD ❌')
    expect(String(message.content)).toContain('Message + listen')
    expect(String(message.content)).toContain('Action + listen')
    expect(String(message.content)).toContain('Message + action')
    expect(String(initial.content)).toContain('"""\n■start\n■send=message\nYour answer here.\n■next=listen\n■end\n"""')
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
    expect(examples[4]!.code).toContain('return await')
    expect(examples[5]!.code).toBe('await availableTool({})')
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
    expect(getTranscriptTextComponent([addressed, reply])).toBe('reply')
    const contract = getMessageContract([reply], [ListenExit])
    expect(contract).toContain('■send=reply')
    expect(contract).not.toContain('■send=message')
    expect(getMessageContract([addressed], [ListenExit])).not.toContain('■send=addressed')
    expect(getMessageContract([], [ListenExit])).not.toContain('■send')
    const transcript = new TranscriptArray([{ role: 'assistant', content: '■send=reply\nAlready framed' }])
    expect(transcript.toString({ assistantMessageComponent: 'reply' }).match(/■send=/g)).toHaveLength(1)
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
      for (const example of definition.generation!.examples!) {
        const raw = `■send=${definition.name}${example.props ? ` ${JSON.stringify(example.props)}` : ''}${example.body ? `\n${example.body}` : ''}\n■next=listen`
        const parsed = parseAssistantResponse(`■start\n${raw}\n■end`)
        expect(parsed.diagnostics).toEqual([])
        expect(validateComponent(parsed.sends[0]!, registry)).toMatchObject({ valid: true, errors: [] })
      }
    }
  })

  it('shows a complete response with a question and multiple valid buttons', () => {
    const components = [DefaultComponents.Text, DefaultComponents.Button]
    const output = getProtocolInstructions({ components, exits: [ListenExit] })
    const example = output.split('## Button choices')[1]!.match(/"""\n([\s\S]*?)\n"""/)![1]!
    const parsed = parseAssistantResponse(example)
    expect(parsed.diagnostics).toEqual([])
    expect(parsed.sends.map((send) => send.name)).toEqual(['message', 'button', 'button', 'button'])
    expect(parsed.next?.name).toBe('listen')
    const registry = new ComponentRegistry(components.map(componentToProtocolDefinition))
    for (const send of parsed.sends) expect(validateComponent(send, registry).valid).toBe(true)
    expect(getProtocolInstructions({ components: [DefaultComponents.Text], exits: [ListenExit] })).not.toContain(
      '## Button choices'
    )
    expect(getProtocolInstructions({ components, exits: [] })).not.toContain('## Button choices')
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
  expect(getMessageContract([], [ListenExit])).toContain('There is no message channel')
})

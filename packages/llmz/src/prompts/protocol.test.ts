import { describe, expect, it } from 'vitest'
import { DefaultComponents } from '../component.default.js'
import { ListenExit } from '../context.js'
import { ComponentRegistry } from '../message-stream/registry.js'
import { validateComponent } from '../message-stream/validator.js'
import { parseAssistantResponse } from './common.js'
import { componentToProtocolDefinition, getProtocolInstructions } from './protocol.js'

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
        const parsed = parseAssistantResponse(raw)
        expect(parsed.diagnostics).toEqual([])
        expect(validateComponent(parsed.sends[0]!, registry)).toMatchObject({ valid: true, errors: [] })
      }
    }
  })

  it('shows a complete response with a question and multiple valid buttons', () => {
    const components = [DefaultComponents.Text, DefaultComponents.Button]
    const output = getProtocolInstructions({ components, exits: [ListenExit] })
    const example = output.split('<button_choices_example>')[1]!.match(/<example>\n([\s\S]*?)\n<\/example>/)![1]!
    const parsed = parseAssistantResponse(example)
    expect(parsed.diagnostics).toEqual([])
    expect(parsed.sends.map((send) => send.name)).toEqual(['message', 'button', 'button', 'button'])
    expect(parsed.next?.name).toBe('listen')
    const registry = new ComponentRegistry(components.map(componentToProtocolDefinition))
    for (const send of parsed.sends) expect(validateComponent(send, registry).valid).toBe(true)
    expect(getProtocolInstructions({ components: [DefaultComponents.Text], exits: [ListenExit] })).not.toContain(
      '<button_choices_example>'
    )
    expect(getProtocolInstructions({ components, exits: [] })).not.toContain('<button_choices_example>')
  })
})

import { describe, expect, it } from 'vitest'
import { DefaultComponents } from '../component.default.js'
import { ListenExit } from '../context.js'
import { Exit } from '../exit.js'
import { z } from '@bpinternal/zui'
import { generateInstructionSections } from '../message-stream/instructions.js'
import { ComponentRegistry } from '../message-stream/registry.js'
import { validateComponent } from '../message-stream/validator.js'
import type { NormalizedComponentDefinition } from '../message-stream/types.js'
import { parseAssistantResponse } from './common.js'
import { componentToProtocolDefinition, exitToProtocolDefinition, getProtocolSections } from './protocol.js'

const definitions = [
  ...Object.values(DefaultComponents).map(componentToProtocolDefinition),
  {
    name: 'custom',
    propsJsonSchema: { type: 'object', properties: { count: { type: 'integer' } }, required: ['count'] },
    body: { format: 'text', required: true },
  } satisfies NormalizedComponentDefinition,
]
const exits = [
  ListenExit,
  new Exit({
    name: 'done',
    description: 'Finish.',
    schema: z.object({ total: z.number(), status: z.enum(['ok', 'failed']) }),
  }),
].map(exitToProtocolDefinition)
const registry = new ComponentRegistry(definitions)

const blocks = (text: string) =>
  [...text.matchAll(/^"""\n\(\.\.\.\)\n([\s\S]*?)\n\(\.\.\.\)\n"""$/gm)].map((match) => match[1]!)

describe('examples beside each definition', () => {
  it('shows a multi-button example from the Button definition, even without a text component', () => {
    const sections = getProtocolSections({ components: [DefaultComponents.Button], exits: [ListenExit] })
    const example = blocks(sections.messages).find((block) => (block.match(/■send=button/g) ?? []).length === 3)
    expect(example).toBeDefined()
    expect(example).not.toMatch(/■(?:next|run|start|end)|■send=message/)
    const parsed = parseAssistantResponse(`■start\n${example}\n■next=listen\n■end`)
    expect(parsed.diagnostics).toEqual([])
    expect(parsed.sends.map((send) => send.props.label)).toEqual([
      'Track my order',
      'Return an item',
      'Contact support',
    ])
    for (const send of parsed.sends)
      expect(validateComponent(send, registry)).toMatchObject({ valid: true, errors: [] })
    const withoutButtons = getProtocolSections({ components: [DefaultComponents.Text], exits: [ListenExit] })
    expect(JSON.stringify(withoutButtons)).not.toMatch(/■send=button|Track my order|Return an item|Contact support/)
  })

  it.each(definitions)(
    'shows valid partial examples for $name, including types without curated examples',
    (definition) => {
      const sections = generateInstructionSections([definition], { exits })
      expect(sections.components).toContain(`### ${definition.name}`)
      const examples = blocks(sections.components)
      expect(examples.length).toBeGreaterThan(0)
      for (const example of examples) {
        expect(example).not.toMatch(/■(?:start|end|next|run)/)
        const parsed = parseAssistantResponse(`■start\n${example}\n■next=listen\n■end`)
        expect(parsed.diagnostics).toEqual([])
        expect(parsed.sends.length).toBeGreaterThan(0)
        for (const send of parsed.sends) {
          expect(send.name).toBe(definition.name)
          expect(validateComponent(send, registry)).toMatchObject({ valid: true, errors: [] })
        }
      }
    }
  )

  it.each(exits)('shows a partial example for the $name exit with its required fields', (exit) => {
    const sections = generateInstructionSections([], { exits: [exit] })
    expect(sections.exits).toContain(`### ${exit.name}`)
    const examples = blocks(sections.exits)
    expect(examples).toHaveLength(1)
    const example = examples[0]!
    expect(example).not.toMatch(/■(?:send|run|start|end)/)
    const parsed = parseAssistantResponse(`■start\n${example}\n■end`)
    expect(parsed.diagnostics).toEqual([])
    expect(parsed.next?.name).toBe(exit.name)
    if (exit.name === 'done') expect(parsed.next?.props).toEqual({ total: 1, status: 'ok' })
  })
})

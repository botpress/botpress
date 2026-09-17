import { transforms, z } from '@bpinternal/zui'
import { JSONSchema7 } from 'json-schema'

import { DefaultComponents } from '../component.default.js'
import { Component, ComponentDefinition } from '../component.js'
import { Exit } from '../exit.js'
import { generateInstructions } from '../message-stream/instructions.js'
import type { NormalizedComponentDefinition, NormalizedExitDefinition } from '../message-stream/types.js'

const toJsonSchema = (schema: z.ZodObject<any>): JSONSchema7 => {
  try {
    return transforms.toJSONSchema(schema) as JSONSchema7
  } catch {
    return transforms.toJSONSchemaLegacy(schema) as JSONSchema7
  }
}

const getPropsSchema = (definition: ComponentDefinition): z.ZodObject<any> => {
  switch (definition.type) {
    case 'leaf':
      return definition.leaf.props
    case 'container':
      return definition.container.props
    default:
      return definition.default.props
  }
}

/**
 * Converts a legacy (TSX-era) component definition into the normalized shape
 * used by the message-stream protocol. Components that previously accepted
 * children now accept a single Markdown body; leaf components are props-only.
 */
export const componentToProtocolDefinition = (component: Component): NormalizedComponentDefinition => {
  const definition = component.definition
  const supportsBody = definition.type !== 'leaf' && definition.body !== false
  const bodyOptions = definition.type !== 'leaf' && definition.body ? definition.body : undefined

  return {
    name: definition.name.toLowerCase(),
    description: definition.description,
    propsJsonSchema: toJsonSchema(getPropsSchema(definition)),
    body: supportsBody
      ? {
          format: bodyOptions?.format ?? 'markdown',
          description:
            bodyOptions?.description ?? 'The full, final message content. No variable interpolation or placeholders.',
          required: bodyOptions?.required ?? true,
        }
      : undefined,
    generation: definition.generation,
  }
}

export const exitToProtocolDefinition = (exit: Exit): NormalizedExitDefinition => ({
  name: exit.name.toLowerCase(),
  description: exit.description,
  propsJsonSchema: exit.schema as JSONSchema7 | undefined,
})

/**
 * Builds the model-facing protocol reference (syntax, component catalog, exit
 * catalog and examples) for the current iteration.
 */
export const getProtocolInstructions = ({ components, exits }: { components: Component[]; exits: Exit[] }): string => {
  const instructions = generateInstructions(components.map(componentToProtocolDefinition), {
    exits: exits.map(exitToProtocolDefinition),
    includeRun: true,
    verbosity: 'standard',
    includeExamples: true,
  })

  const listen = exits.map(exitToProtocolDefinition).find((exit) => exit.name === 'listen')
  if (
    !components.includes(DefaultComponents.Text) ||
    !components.includes(DefaultComponents.Button) ||
    !listen ||
    listen.propsJsonSchema?.required?.length
  ) {
    return instructions
  }

  return `${instructions}

<button_choices_example>
One response can contain a question and several button choices. Send each button as its own block, then wait for the user with ONE final exit.
<example>
■send=message
How can I help with your order?
■send=button {"action":"say","label":"Track my order"}
■send=button {"action":"say","label":"Return an item"}
■send=button {"action":"say","label":"Contact support"}
■next=listen
</example>
</button_choices_example>`
}

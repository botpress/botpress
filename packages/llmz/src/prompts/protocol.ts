import { transforms, z } from '@bpinternal/zui'
import { JSONSchema7 } from 'json-schema'

import { DefaultComponents } from '../component.default.js'
import { Component, ComponentDefinition } from '../component.js'
import { exampleBoundaryInstructions, quoteResponseExample } from '../example-format.js'
import { Exit } from '../exit.js'
import { exitExample, generateInstructions } from '../message-stream/instructions.js'
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

/** A historical text reply must not invent props or use an unavailable component. */
export const getTranscriptTextComponent = (components: Component[]): string | undefined => {
  const candidates = components
    .map(componentToProtocolDefinition)
    .filter(
      (component) => component.body && component.body.format !== 'code' && !component.propsJsonSchema.required?.length
    )
  return (
    candidates.find((component) => component.name === 'message') ??
    candidates.find((component) => component.name === 'md') ??
    candidates[0]
  )?.name
}

/** Keep the simplest complete response close to generation, even with a large component catalogue. */
export const getMessageContract = (components: Component[], exits: Exit[], includeFormats = true): string => {
  const name = getTranscriptTextComponent(components)
  const listen = exits.find((exit) => exit.name.toLowerCase() === 'listen')
  const canListen = listen && !(listen.schema as JSONSchema7 | undefined)?.required?.length
  const answer = name && canListen ? `■send=${name}\nYour answer here.\n■next=listen` : undefined
  const action = '■run\nreturn await availableTool({})'
  const done = exits[0]
  const finish = done ? exitExample(exitToProtocolDefinition(done)) : undefined
  const lines = [
    '# Response format',
    'REQUIRED: Output one complete response. The first line is exactly ■start. The last line is exactly ■end. Nothing goes outside these boundaries.',
    name
      ? `Every word for the user goes inside ■send=${name}. Never answer in plain text. Keep reasoning private. If exact text or raw JSON is requested, put ONLY that literal content in the message body, without introductions, extra quotes, or Markdown fences.`
      : components.length
        ? 'User-facing messages must use registered ■send components with their required JSON props and documented body format. Never write unmarked prose or invent a text component.'
        : 'There is no message channel. Immediately after ■start, write ■run or ■next=<exit>. Every remaining line belongs to that block or the closing ■end. A natural-language sentence is invalid in ANY language, including a translation or restatement of the result. Report results only as JSON props of the exit.',
    exampleBoundaryInstructions,
  ]
  if (includeFormats && name) {
    lines.push(
      'BAD ❌ — missing the message header:',
      quoteResponseExample(`Hello!${canListen ? '\n■next=listen' : ''}`),
      'CORRECT ✅ — header before the reply:',
      quoteResponseExample(answer ?? `■send=${name}\nChecking.\n${action}`)
    )
  }
  if (!components.length && finish) {
    lines.push(
      'BAD ❌ — unmarked prose is invalid:',
      quoteResponseExample(`The task is complete.\n${finish}`),
      'CORRECT ✅ — only the exit, with actual task values:',
      quoteResponseExample(finish)
    )
  }
  if (answer) lines.push('Message + listen — answer or ask a question:', quoteResponseExample(answer))
  lines.push(
    'Action — call a tool and inspect its result next turn:',
    quoteResponseExample(action),
    'availableTool is a placeholder. Use an actual tool from the API with its real inputs.'
  )
  if (includeFormats && name) {
    lines.push(
      'Message + action — only when a progress update is requested:',
      quoteResponseExample(`■send=${name}\nChecking.\n${action}`)
    )
  }
  if (canListen) {
    lines.push(
      'Action + listen — when the task requests a silent final action, await the tool WITHOUT return and use the requested exit in this same response. No extra result-inspection turn is needed:',
      quoteResponseExample('■run\nawait availableTool({})\n■next=listen'),
      'Listen — only when intentional silence is appropriate:',
      quoteResponseExample('■next=listen')
    )
  }
  if (!answer && finish) {
    lines.push('Finish — choose an available exit and supply its required props as JSON:', quoteResponseExample(finish))
  }
  lines.push(
    'Use at most one ■run. Put any messages BEFORE it. After code returning a result, close with ■end and wait for the result. Otherwise finish with ■next and then ■end.',
    'Generate exactly ONE response, then stop. Do not continue the conversation, repeat the response, or write another marker after ■end. Start directly with ■start, without analysis or a thinking preamble. Do not wrap the response in Markdown code fences. Do not output triple quotes or documentation headings.',
    'Begin with ■start. End with ■end.'
  )
  return lines.join('\n\n')
}

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

## Button choices
One response can contain a question and several button choices. Send each button as its own block, then wait for the user with ONE final exit.

${quoteResponseExample(`■send=message
How can I help with your order?
■send=button {"action":"say","label":"Track my order"}
■send=button {"action":"say","label":"Return an item"}
■send=button {"action":"say","label":"Contact support"}
■next=listen`)}

`
}

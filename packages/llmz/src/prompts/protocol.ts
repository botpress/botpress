import { transforms, z } from '@bpinternal/zui'
import { JSONSchema7 } from 'json-schema'

import { Component, ComponentDefinition } from '../component.js'
import { exampleBoundaryInstructions, quotePartialExample, quoteResponseExample } from '../example-format.js'
import { Exit } from '../exit.js'
import {
  componentExample,
  exitExample,
  generateInstructions,
  generateInstructionSections,
} from '../message-stream/instructions.js'
import type { NormalizedComponentDefinition, NormalizedExitDefinition } from '../message-stream/types.js'

import CHAT_PROTOCOL from './chat-mode/protocol.js'
import { finalActionExample, noPlaceholders, readResultExample } from './protocol-basics.js'
import WORKER_PROTOCOL from './worker-mode/protocol.js'

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

/** Choose a text component for examples and reminders without inventing required props. */
export const getTextMessageComponent = (components: Component[]): string | undefined => {
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
const getResponseFormatSections = (components: Component[], exits: Exit[], includeFormats = true) => {
  const name = getTextMessageComponent(components)
  const listen = exits.find((exit) => exit.name.toLowerCase() === 'listen')
  const canListen = components.length > 0 && listen && !(listen.schema as JSONSchema7 | undefined)?.required?.length
  const answer = name && canListen ? `■send=${name}\nHello!\n■next=listen` : undefined
  const action = readResultExample
  const done = exits[0]
  const finish = done ? exitExample(exitToProtocolDefinition(done)) : undefined
  const rules = [
    'Start with ■start on its own line. End with ■end on its own line. Write nothing outside these boundaries. Do not add triple quotes or Markdown code fences around the response.',
    components.length
      ? `Use ■send=${name ?? components[0]?.definition.name.toLowerCase()} before any text for the user. Use a type from SECTION 2 and include its required fields. Write the final text itself, not thoughts or placeholders.`
      : 'Use only ■run or ■next= followed by an available exit name after ■start. Put the result in the exit fields. Do not add explanations in any language.',
  ]
  const lines = [exampleBoundaryInstructions]
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
    'Code — return a value to inspect next turn:',
    quoteResponseExample(action),
    'These values only illustrate the format. Use the code and facts needed for your task.'
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
      quoteResponseExample(`${finalActionExample}\n■next=listen`),
      'exampleSaveTotal is fictional and unavailable. Use a real tool from the API with its real inputs.',
      'Listen — only when intentional silence is appropriate:',
      quoteResponseExample('■next=listen')
    )
  }
  if (!answer && finish) {
    lines.push('Finish — choose an available exit and supply its required props as JSON:', quoteResponseExample(finish))
  }
  const closing = [
    ...(components.length ? ['Put every ■send before ■run. Never send a message after code.'] : []),
    'Use at most one ■run. To read a result next turn: return the result, then write ■end. Do not add ■next after return. To finish now: do not return a result; write ■next= followed by an available exit name with its required JSON fields on the same line, then ■end.',
    noPlaceholders,
    'Use the patterns in SECTION 1. Write one response only, then stop.',
    'Begin with ■start. End with ■end.',
  ]
  return { rules, examples: lines, closing }
}

export const getMessageContract = (components: Component[], exits: Exit[], includeFormats = true): string => {
  const { rules, examples, closing } = getResponseFormatSections(components, exits, includeFormats)
  return ['# Response format', ...rules, ...(includeFormats ? examples : []), ...closing].join('\n\n')
}

const partialExamplesReminder =
  'Each example below shows only one block. (...) means other parts of the response are omitted. Do NOT write (...) or the triple quotes in your response. Use SECTION 1 to put blocks together into a complete response.'

/** Keep each block example beside its definition, separate from complete response patterns. */
export const getProtocolSections = ({ components, exits }: { components: Component[]; exits: Exit[] }) => {
  const sections = generateInstructionSections(components.map(componentToProtocolDefinition), {
    exits: exits.map(exitToProtocolDefinition),
  })
  const canTalk = components.length > 0
  const textComponent = getTextMessageComponent(components)
  const messageCorrection = textComponent
    ? [
        'BAD ❌ — missing the message header:',
        quotePartialExample('Hello!'),
        'CORRECT ✅ — header before the reply:',
        quotePartialExample(`■send=${textComponent}\nHello!`),
      ].join('\n\n')
    : ''
  const defaultExit = exits.find((exit) => exit.name.toLowerCase() === 'listen') ?? exits[0]
  const exit = defaultExit && exitExample(exitToProtocolDefinition(defaultExit))
  const sampleComponent = components.find((c) => c.definition.name.toLowerCase() === textComponent) ?? components[0]
  const send = sampleComponent && componentExample(componentToProtocolDefinition(sampleComponent))
  const exitCorrection = exit
    ? [
        'BAD ❌ — missing the exit command:',
        quotePartialExample(exit.replace('■next=', '')),
        'CORRECT ✅ — name the exit with ■next:',
        quotePartialExample(exit),
      ].join('\n\n')
    : ''
  return {
    specifications: send ? CHAT_PROTOCOL(send, exit) : WORKER_PROTOCOL(exit),
    messages: canTalk
      ? [partialExamplesReminder, messageCorrection, sections.components].filter(Boolean).join('\n\n')
      : '',
    exits: sections.exits
      ? [partialExamplesReminder, exitCorrection, sections.exits].join('\n\n')
      : 'No exits are available.',
    summary: getMessageContract(components, exits, false),
  }
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

  return instructions
}

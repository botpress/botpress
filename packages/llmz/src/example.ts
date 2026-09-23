import { parse } from 'acorn'
import type { Component } from './component.js'
import { exampleBoundaryInstructions, quoteResponseExample } from './example-format.js'
import type { Exit } from './exit.js'
import { ComponentRegistry } from './message-stream/registry.js'
import { MARKER, NAME_REGEX } from './message-stream/types.js'
import { validateComponent, validateProps } from './message-stream/validator.js'
import { componentToProtocolDefinition, exitToProtocolDefinition } from './prompts/protocol.js'

export type ExampleMessage = {
  component: Component | string
  props?: Record<string, unknown>
  body?: string
}

/** Exactly one model response: messages followed by code or an exit. */
type ExampleResponse = {
  messages?: ExampleMessage[]
} & (
  | { code: string; exit?: never; props?: never }
  | { exit: Exit | string; props?: Record<string, unknown>; code?: never }
)

/** One hypothetical situation and the single response to produce in it. */
export type ExampleDefinition = {
  /** Include the request, known facts, or previous tool results needed to understand this response. */
  situation: string
  /** Optional explanation of why this response is appropriate. Context for the model, not generated output. */
  reason?: string
} & ExampleResponse

const assertNoMarker = (text: string): string => {
  if (text.includes(MARKER)) {
    throw new Error('Example content must not contain the reserved protocol marker (■).')
  }

  return text
}

const json = (value: unknown): string => {
  const text = JSON.stringify(value)
  if (text === undefined) {
    throw new Error('Example values must be JSON serializable.')
  }

  return text
}

const name = (value: string): string => {
  const normalized = value.toLowerCase()
  if (!NAME_REGEX.test(normalized)) {
    throw new Error(`Invalid example component or exit name: ${value}`)
  }

  return normalized
}

const propsText = (props?: Record<string, unknown>): string => {
  if (props === undefined) {
    return ''
  }

  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    throw new Error('Example props must be a JSON object.')
  }

  return ` ${assertNoMarker(json(props))}`
}

const renderOutput = (output: ExampleResponse): string => {
  if (!output || Array.isArray(output)) {
    throw new Error('An example requires one output. Multi-iteration examples are not supported.')
  }

  if ('result' in output || 'iterations' in output || 'steps' in output) {
    throw new Error('An example demonstrates one response, not tool results or multiple iterations.')
  }

  const blocks = (output.messages ?? []).map((message) => {
    const component = typeof message.component === 'string' ? message.component : message.component.definition.name
    const header = `${MARKER}send=${name(component)}${propsText(message.props)}`
    const body = message.body === undefined ? '' : `\n${assertNoMarker(message.body)}`

    return header + body
  })

  if (output.code !== undefined) {
    if (output.exit !== undefined) {
      throw new Error('An example output must use code or an exit, not both.')
    }

    const code = assertNoMarker(output.code.trim())
    if (!code) {
      throw new Error('Example code must not be empty.')
    }

    // Validate syntax only. Examples are never executed.
    parse(code, { ecmaVersion: 'latest', allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true })
    blocks.push(`${MARKER}run\n${code}`)
  } else if (output.exit !== undefined) {
    const exitName = typeof output.exit === 'string' ? output.exit : output.exit.name
    blocks.push(`${MARKER}next=${name(exitName)}${propsText(output.props)}`)
  } else {
    throw new Error('An example output must end with code or an exit.')
  }

  return blocks.join('\n')
}

/**
 * Builds one protocol-correct response to one hypothetical situation.
 *
 * @example
 * new Example({
 *   situation: 'The user asks a question that needs a knowledge-base search.',
 *   reason: 'Search first so the answer can use actual evidence.',
 *   code: 'return await searchKnowledge({ query: "reset password" })',
 * })
 */
export class Example {
  public readonly situation: string
  public readonly reason?: string
  public readonly output: string

  public constructor(definition: ExampleDefinition) {
    if (typeof definition.situation !== 'string' || !definition.situation.trim()) {
      throw new Error('An example requires a non-empty situation.')
    }

    this.situation = definition.situation
    this.reason = definition.reason
    this.output = renderOutput(definition)
  }
}

// Escape metadata; keep the demonstrated response literal, including JavaScript operators.
const metadata = (text: string): string => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

/** Internal prompt renderer. Checks examples against this iteration's component/exit catalog. */
export const renderExamples = async (
  examples: readonly Example[],
  components: Component[],
  exits: Exit[]
): Promise<string> => {
  if (!examples.length) {
    return ''
  }

  const registry = new ComponentRegistry(components.map(componentToProtocolDefinition))
  const exitDefinitions = exits.map(exitToProtocolDefinition)
  const { parseAssistantResponse } = await import('./prompts/common.js')

  const render = (output: string) => {
    const response = parseAssistantResponse(`■start\n${output}\n■end`)
    if (response.diagnostics?.length || response.items.some((item) => item.status === 'invalid')) {
      throw new Error('Invalid few-shot protocol output.')
    }

    for (const message of response.sends) {
      const validation = validateComponent(message, registry)
      if (!validation.valid) {
        throw new Error(`Invalid few-shot message: ${validation.errors.map((e) => e.message).join('; ')}`)
      }
    }

    if (response.next) {
      const exit = exitDefinitions.find((exit) => exit.name === response.next!.name)
      if (!exit) {
        throw new Error(`Unknown few-shot exit: ${response.next.name}`)
      }

      const errors = validateProps(
        response.next.props,
        exit.propsJsonSchema ?? { type: 'object', additionalProperties: false }
      )

      if (errors.length) {
        throw new Error(`Invalid few-shot exit: ${errors.map((e) => e.message).join('; ')}`)
      }
    }

    return output
  }

  return [
    '<few_shots>',
    components.length
      ? 'These are hypothetical examples, NOT the conversation transcript. Each example shows ONE desired response.'
      : 'These are hypothetical examples, NOT actual task history. Each example shows ONE desired response.',
    'Use examples whose KIND of situation applies, not just the same names or numbers. Conditions such as "only when requested" are required: sharing a tool or topic is not enough.',
    exampleBoundaryInstructions,
    'Only the text between triple quotes in response demonstrates output. Situation and optional reason explain the example; never emit their text or XML tags.',
    ...examples.map((example, index) =>
      [
        `<example number="${index + 1}">`,
        `<situation>\n${metadata(example.situation)}\n</situation>`,
        ...(example.reason ? [`<reason>\n${metadata(example.reason)}\n</reason>`] : []),
        `<response>\n${quoteResponseExample(render(example.output))}\n</response>`,
        '</example>',
      ].join('\n')
    ),
    'Apply the matching examples within the explicit assigned instructions and current user request. Those explicit requirements ALWAYS win: if they require silence, omit an example announcement; if they require normal casing, ignore ALL CAPS in an example; if they require sequential calls, do not copy parallel calls.',
    'Where explicit instructions leave a choice, preserve the applicable example’s casing (including ALL CAPS), tone, and order of actions. This demonstrated behavior replaces the defaults. Substitute actual facts for hypothetical facts.',
    '</few_shots>',
  ].join('\n')
}

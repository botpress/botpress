import type { CognitiveMessage, CognitiveTool, CognitiveToolCall } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { assertValidComponent, getComponentMethodName, type Component, type RenderedComponent } from '../component.js'
import type { Exit } from '../exit.js'
import { inspect } from '../inspect.js'
import { isVoiceMessage, type Transcript } from '../transcript.js'

export type NativeToolBinding = { kind: 'javascript'; name: string }

export type NativeToolCatalogue = {
  tools: CognitiveTool[]
  bindings: Map<string, NativeToolBinding>
}

export type ValidatedNativeCall = {
  call: CognitiveToolCall
  id: string
  name: string
  kind: 'javascript'
  code: string
}

export type NativePresentationInput = {
  component: string
  props: Record<string, unknown>
}

export type NativeChatMethod = {
  name: string
  component: Component
  schema: z.ZodType
  multiple: boolean
}

/** The prompt and VM share one component-to-method mapping and input schema. */
export function getNativeChatMethods(components: readonly Component[]): NativeChatMethod[] {
  validateUniqueNames(
    components.map((component) => component.definition),
    'component'
  )

  const names = new Set<string>()

  return components.map((component) => {
    const definition = component.definition
    assertValidComponent(definition)
    const aliases = [definition.name, ...(definition.aliases ?? [])]
    const multiple = aliases.some((name) => name.toLowerCase() === 'button')
    const name = getComponentMethodName(definition)

    if (names.has(name)) {
      throw new Error(`Component ${definition.name} produces a duplicate chat method: ${name}`)
    }

    names.add(name)

    const input = definition.props
    return { name, component, schema: multiple ? z.array(input).min(1) : input, multiple }
  })
}

/** Validate one synchronous send before rendering or delivering any of its messages. */
export function renderNativeChatInput(method: NativeChatMethod, input: unknown): RenderedComponent[] {
  const parsed = method.schema.parse(input)
  const messages: Record<string, unknown>[] = method.multiple ? parsed : [parsed]

  return messages.map((props) => renderParsedComponent(method.component, props))
}

function renderParsedComponent(component: Component, props: Record<string, unknown>): RenderedComponent {
  return { type: 'component', name: component.definition.name, props }
}

function validateUniqueNames(items: ReadonlyArray<{ name: string; aliases?: readonly string[] }>, kind: string): void {
  const names = new Set<string>()

  for (const item of items) {
    const ownNames = new Set([item.name, ...(item.aliases ?? [])].map((name) => name.toLowerCase()))

    for (const name of ownNames) {
      if (names.has(name)) {
        throw new Error(`Duplicate ${kind} name or alias: ${name}`)
      }

      names.add(name)
    }
  }
}

/** All execution, presentation, and completion happen inside one native JavaScript call. */
export function createNativeToolCatalogue({
  components,
  exits,
}: {
  components: readonly Component[]
  exits: readonly Exit[]
}): NativeToolCatalogue {
  getNativeChatMethods(components)
  validateUniqueNames(exits, 'exit')

  return {
    tools: [
      {
        name: 'run_javascript',
        description:
          'Execute JavaScript using the available tools and memory. See the "run_javascript syntax" section of the system prompt for the input format, supported syntax, and API references.',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              minLength: 1,
              description: 'JavaScript source with an explicit return statement. Top-level await is supported.',
            },
          },
          required: ['code'],
          additionalProperties: false,
        },
      },
    ],
    bindings: new Map([['run_javascript', { kind: 'javascript', name: 'run_javascript' }]]),
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function validateJavaScriptCall(call: CognitiveToolCall, catalogue: NativeToolCatalogue): ValidatedNativeCall {
  if (!catalogue.bindings.has(call.name)) {
    throw new Error(`Unknown native tool ${JSON.stringify(call.name)}. Use run_javascript.`)
  }

  if (!isObject(call.input)) {
    throw new Error('Tool arguments must be a JSON object.')
  }

  const unknownKeys = Object.keys(call.input).some((key) => key !== 'code')

  if (unknownKeys || typeof call.input.code !== 'string' || !call.input.code.trim()) {
    throw new Error('run_javascript requires exactly one non-empty code string.')
  }

  return {
    call,
    id: call.id,
    name: call.name,
    kind: 'javascript',
    code: call.input.code,
  }
}

/** Reject an invalid or multi-call response before any delivery or business action begins. */
export function validateNativeToolCalls(
  calls: readonly CognitiveToolCall[],
  catalogue: NativeToolCatalogue
): { valid: boolean; errors: string[]; calls: ValidatedNativeCall[] } {
  const errors: string[] = []
  const validated: ValidatedNativeCall[] = []
  const ids = new Set<string>()

  if (calls.length > 1) {
    errors.push('Use at most one run_javascript call per response. Put all operations inside its JavaScript program.')
  }

  for (const call of calls) {
    if (!call || typeof call.id !== 'string' || !call.id.trim()) {
      errors.push('Every native tool call requires a non-empty ID.')
      continue
    }

    if (ids.has(call.id)) {
      errors.push(`Duplicate native tool call ID: ${call.id}`)
    }

    ids.add(call.id)

    try {
      validated.push(validateJavaScriptCall(call, catalogue))
    } catch (error) {
      errors.push(`${call.id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return { valid: errors.length === 0, errors, calls: errors.length ? [] : validated }
}

function findPresentationComponent(name: string, components: readonly Component[]): Component {
  const component = components.find((candidate) => {
    const names = [candidate.definition.name, ...(candidate.definition.aliases ?? [])]

    return names.some((candidateName) => candidateName.toLowerCase() === name.toLowerCase())
  })

  if (!component) {
    throw new Error(`Unknown presentation component: ${name}`)
  }

  return component
}

function validatePresentation(input: unknown, components: readonly Component[]): NativePresentationInput {
  if (!isObject(input) || typeof input.component !== 'string') {
    throw new Error('A presentation requires { component, props }.')
  }

  if (Object.keys(input).some((key) => !['component', 'props'].includes(key))) {
    throw new Error('A presentation only accepts component and props.')
  }

  const component = findPresentationComponent(input.component, components)
  const definition = component.definition
  const rawProps = input.props

  if (!isObject(rawProps)) {
    throw new Error('Component props must be a JSON object.')
  }

  return {
    component: definition.name,
    props: definition.props.parse(rawProps) as Record<string, unknown>,
  }
}

/** Validate all message schemas without invoking renderers or delivery handlers. */
export function validateNativePresentationInputs(
  inputs: unknown,
  components: readonly Component[]
): NativePresentationInput[] {
  if (!Array.isArray(inputs) || !inputs.length) {
    throw new Error('A presentation requires a non-empty messages array.')
  }

  validateUniqueNames(
    components.map((component) => component.definition),
    'component'
  )

  return inputs.map((input) => validatePresentation(input, components))
}

/** Prepare the whole batch before the caller can deliver its first message. */
export function validateNativePresentations(inputs: unknown, components: readonly Component[]): RenderedComponent[] {
  const validated = validateNativePresentationInputs(inputs, components)

  return validated.map((input) => {
    const component = findPresentationComponent(input.component, components)

    return renderParsedComponent(component, input.props)
  })
}

function getTranscriptText(entry: Transcript.Message): string {
  if (entry.role === 'event') {
    const payload = inspect(entry.payload, undefined, { tokens: 5000 }) ?? 'undefined'

    return `Event: ${entry.name}\n${payload}`
  }

  if (entry.role === 'summary') {
    return `Earlier conversation summary:\n${entry.content}`
  }

  const text = entry.name ? `[${entry.name}]\n${entry.content}` : entry.content

  if (isVoiceMessage(entry)) {
    const hasAudio = entry.role === 'user' && entry.attachments?.some((attachment) => attachment.type === 'audio')
    const label = hasAudio ? '[Voice message]' : '[Voice message; transcribed]'

    return `${label}\n${text}`
  }

  return text
}

/** Attach media to its actual turn; never collect old attachments onto a new user message. */
export function transcriptToNativeMessages(transcript: readonly Transcript.Message[]): CognitiveMessage[] {
  return Array.from(transcript, (entry): CognitiveMessage => {
    const role = entry.role === 'assistant' ? 'assistant' : 'user'
    const text = getTranscriptText(entry)

    const attachments = 'attachments' in entry ? entry.attachments : undefined

    if (!attachments?.length) {
      return { role, content: text }
    }

    const content: Exclude<CognitiveMessage['content'], string | null> = [{ type: 'text', text }]

    for (const attachment of attachments) {
      if (attachment.id || attachment.alt) {
        content.push({
          type: 'text',
          text: [attachment.id && `Attachment ${attachment.id}`, attachment.alt].filter(Boolean).join(': '),
        })
      }

      content.push({ type: attachment.type, url: attachment.url })
    }

    return { role, type: 'multipart', content }
  })
}

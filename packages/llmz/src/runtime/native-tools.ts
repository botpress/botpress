import type { CognitiveMessage, CognitiveTool, CognitiveToolCall } from '@botpress/cognitive'
import { transforms, z } from '@bpinternal/zui'
import type { JSONSchema7 } from 'json-schema'
import type { Component, ComponentDefinition, RenderedComponent } from '../component.js'
import type { Exit } from '../exit.js'
import { inspect } from '../inspect.js'
import { isVoiceMessage, type Transcript } from '../transcript.js'

const TEXT_NAMES = new Set(['message', 'text', 'markdown', 'md', 'speech'])

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
  props?: Record<string, unknown>
  body?: string
}

export function getComponentPropsSchema(definition: ComponentDefinition): z.ZodObject<any> {
  switch (definition.type) {
    case 'leaf':
      return definition.leaf.props
    case 'container':
      return definition.container.props
    case 'default':
      return definition.default.props
  }
}

export function getComponentJSONSchema(component: Component): JSONSchema7 {
  const schema = getComponentPropsSchema(component.definition)

  try {
    return transforms.toJSONSchema(schema) as JSONSchema7
  } catch {
    return transforms.toJSONSchemaLegacy(schema) as JSONSchema7
  }
}

/** Text and spoken prose use ordinary assistant output and preserve native streaming. */
export function isNativeTextComponent(component: Component): boolean {
  const definition = component.definition

  return (
    TEXT_NAMES.has(definition.name.toLowerCase()) &&
    definition.type !== 'leaf' &&
    definition.body !== false &&
    !getComponentJSONSchema(component).required?.length
  )
}

export function getNativeTextComponent(components: readonly Component[]): Component | undefined {
  const candidates = components.filter(isNativeTextComponent)

  return candidates.find((component) => component.definition.name.toLowerCase() === 'message') ?? candidates[0]
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
  validateUniqueNames(
    components.map((component) => component.definition),
    'component'
  )
  validateUniqueNames(exits, 'exit')

  return {
    tools: [
      {
        name: 'run_javascript',
        description:
          'Run JavaScript using the documented functions and memory. Return inspect(value) to inspect data in another response; return exit(...) to finish; return chat.present(...) to deliver rich messages and finish. Use at most one native call. Await independent business calls with Promise.all inside JavaScript.',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              minLength: 1,
              description: 'JavaScript source. Top-level await and return are supported.',
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
    throw new Error('A presentation requires { component, props?, body? }.')
  }

  if (Object.keys(input).some((key) => !['component', 'props', 'body'].includes(key))) {
    throw new Error('A presentation only accepts component, props, and body.')
  }

  const component = findPresentationComponent(input.component, components)
  const definition = component.definition
  const hasBody = definition.type !== 'leaf' && definition.body !== false
  const bodyOptions = definition.type !== 'leaf' && definition.body ? definition.body : undefined
  const rawProps = input.props === undefined ? {} : input.props
  const body = input.body

  if (!isObject(rawProps)) {
    throw new Error('Component props must be a JSON object.')
  }

  if (body !== undefined && !hasBody) {
    throw new Error(`Component ${definition.name} has no body.`)
  }

  if (body !== undefined && typeof body !== 'string') {
    throw new Error('Component body must be a string.')
  }

  if (hasBody && (bodyOptions?.required ?? true) && (typeof body !== 'string' || !body.trim())) {
    throw new Error(`Component ${definition.name} requires a non-empty body.`)
  }

  return {
    component: definition.name,
    props: getComponentPropsSchema(definition).parse(rawProps) as Record<string, unknown>,
    ...(body === undefined ? {} : { body }),
  }
}

/** Validate all message schemas without invoking renderers or delivery handlers. */
export function validateNativePresentationInputs(
  inputs: unknown,
  components: readonly Component[]
): NativePresentationInput[] {
  if (!Array.isArray(inputs) || !inputs.length) {
    throw new Error('A presentation requires a non-empty messages array. Return exit() to wait silently.')
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

    return component.render(input.props ?? {}, input.body === undefined ? [] : [input.body])
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

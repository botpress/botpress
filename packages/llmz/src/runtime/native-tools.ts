import type { CognitiveMessage, CognitiveTool, CognitiveToolCall } from '@botpress/cognitive'
import { inspect } from '../inspect.js'
import { isVoiceMessage, type Transcript } from '../transcript.js'

export const RUN_JAVASCRIPT_TOOL: CognitiveTool = {
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
}

export type ValidatedNativeCall = {
  id: string
  code: string
}

export type NativeCallValidation = { valid: true; call?: ValidatedNativeCall } | { valid: false; errors: string[] }

/** Validate the entire response before any delivery or business action begins. */
export function validateNativeToolCalls(calls: readonly CognitiveToolCall[]): NativeCallValidation {
  if (!calls.length) {
    return { valid: true }
  }

  if (calls.length > 1) {
    return {
      valid: false,
      errors: ['Use at most one run_javascript call per response. Put all operations inside its JavaScript program.'],
    }
  }

  const [call] = calls

  if (!call || typeof call.id !== 'string' || !call.id.trim()) {
    return { valid: false, errors: ['Every native tool call requires a non-empty ID.'] }
  }

  if (call.name !== RUN_JAVASCRIPT_TOOL.name) {
    return { valid: false, errors: [`Unknown native tool ${JSON.stringify(call.name)}. Use run_javascript.`] }
  }

  const input = call.input

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, errors: ['Tool arguments must be a JSON object.'] }
  }

  if (Object.keys(input).some((key) => key !== 'code') || typeof input.code !== 'string' || !input.code.trim()) {
    return { valid: false, errors: ['run_javascript requires exactly one non-empty code string.'] }
  }

  return { valid: true, call: { id: call.id, code: input.code } }
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

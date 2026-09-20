import type { CognitiveMessage, CognitiveToolCall } from '@botpress/cognitive'
import { createInspector } from '../inspection.js'
import { assertPersistableData } from './json.js'
import { type Transcript, validateTranscriptMessage, isVoiceMessage } from './transcript.js'

/** A native message plus opaque adapter fields, preserved without interpreting them. */
export type SessionMessage = CognitiveMessage & Record<string, unknown>

export type SessionInput = CognitiveMessage | Transcript.Message

export type AssistantResponse = {
  output: string
  toolCalls?: CognitiveToolCall[]
  assistantMessage?: CognitiveMessage
  continuation?: unknown
}

function asSessionMessage(message: CognitiveMessage): SessionMessage {
  return structuredClone(message) as SessionMessage
}

export function normalizeInput(message: SessionInput): SessionMessage {
  assertPersistableData(message)

  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new Error('Session input must be a message object.')
  }

  validateInputToolCalls(message as CognitiveMessage)

  const extended =
    message.role === 'event' || message.role === 'summary' || 'attachments' in message || 'modality' in message

  if (!extended) {
    validateInputMessage(message as CognitiveMessage)

    return asSessionMessage(message as CognitiveMessage)
  }

  if ('type' in message && message.type !== undefined && message.type !== 'text') {
    throw new Error('Transcript convenience fields cannot be combined with a native message type.')
  }

  const transcript = message as Transcript.Message
  validateTranscriptMessage(transcript)

  if (transcript.role === 'event') {
    if (typeof transcript.name !== 'string' || !transcript.name.length || !('payload' in transcript)) {
      throw new Error('Event messages require a name and payload.')
    }
  } else if (typeof transcript.content !== 'string') {
    throw new Error('Transcript message content must be a string.')
  }

  if ('attachments' in transcript && transcript.attachments !== undefined) {
    if (!Array.isArray(transcript.attachments)) {
      throw new Error('Message attachments must be an array.')
    }

    for (const attachment of transcript.attachments) {
      if (
        !attachment ||
        !['image', 'audio'].includes(attachment.type) ||
        typeof attachment.url !== 'string' ||
        !attachment.url.length ||
        (attachment.id !== undefined && typeof attachment.id !== 'string') ||
        (attachment.alt !== undefined && typeof attachment.alt !== 'string')
      ) {
        throw new Error('Message attachments require an image or audio type and a URL.')
      }
    }
  }

  const normalized = transcriptMessage(transcript)
  validateInputMessage(normalized)

  return normalized
}

export function createAssistantMessage(response: AssistantResponse): SessionMessage {
  if (response.assistantMessage) {
    return asSessionMessage(response.assistantMessage)
  }

  const message: SessionMessage = {
    role: 'assistant',
    content: response.output || null,
  }

  if (response.toolCalls?.length) {
    message.type = 'tool_calls'
    message.toolCalls = response.toolCalls.map((call) => ({
      id: call.id,
      type: 'function',
      function: {
        name: call.name,
        arguments: structuredClone(call.input),
      },
    }))
  }

  return message
}

export function validateInputMessage(message: CognitiveMessage): void {
  assertPersistableData(message)
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new Error('Session input must be a message object.')
  }

  if (message.role === 'system') {
    throw new Error('Session input cannot contain system messages. Supply execute instructions instead.')
  }

  validateInputToolCalls(message)

  if (!['user', 'assistant'].includes(message.role)) {
    throw new Error(`Invalid session message role: ${message.role}`)
  }

  if (message.type !== undefined && !['text', 'multipart'].includes(message.type)) {
    throw new Error(`Invalid session message type: ${message.type}`)
  }

  validateMessageContent(message)
}

export function validateMessageContent(message: CognitiveMessage): void {
  if (typeof message.content !== 'string' && message.content !== null && !Array.isArray(message.content)) {
    throw new Error('Native message content must be text, multipart content, or null.')
  }

  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (
        !part ||
        (part.type === 'text'
          ? typeof part.text !== 'string'
          : !['image', 'audio'].includes(part.type) || typeof part.url !== 'string' || !part.url.length)
      ) {
        throw new Error('Native content parts require text or an image/audio URL.')
      }
    }
  }
}

function validateInputToolCalls(message: CognitiveMessage): void {
  if (
    (message.toolCalls !== undefined && (!Array.isArray(message.toolCalls) || message.toolCalls.length > 0)) ||
    message.type === 'tool_calls' ||
    message.type === 'tool_result' ||
    message.toolResultCallId !== undefined
  ) {
    throw new Error(
      'New session input cannot contain tool calls/results. Restore a serialized Session to continue native history.'
    )
  }
}

function transcriptMessage(message: Transcript.Message): SessionMessage {
  let content: string

  if (message.role === 'event') {
    const payload = createInspector()(message.payload, {
      purpose: 'event',
      maxTokens: 5000,
      identity: { name: message.name },
    })
    content = `External event ${JSON.stringify(message.name)}:\n${payload}`
  } else if (message.role === 'summary') {
    content = `Conversation summary:\n${message.content}`
  } else {
    content = message.content
  }

  if (isVoiceMessage(message)) {
    content = `Voice message (transcript):\n${content}`
  }

  const attachments = 'attachments' in message ? (message.attachments ?? []) : []
  const parts: Exclude<CognitiveMessage['content'], string | null> = [{ type: 'text', text: content }]

  for (const attachment of attachments) {
    if (attachment.id || attachment.alt) {
      parts.push({
        type: 'text',
        text: `Attachment ${JSON.stringify(attachment.id ?? '')}${attachment.alt ? `: ${attachment.alt}` : ''}`,
      })
    }

    parts.push({ type: attachment.type, url: attachment.url })
  }

  const metadata = Object.fromEntries(
    Object.entries(message).filter(
      ([key]) => !['role', 'content', 'type', 'attachments', 'modality', 'payload', 'name'].includes(key)
    )
  )
  // Participant identity remains available without changing native text or signed fields.
  if ('name' in message && message.role !== 'event' && message.name !== undefined) {
    metadata.name = message.name
  }

  return {
    ...structuredClone(metadata),
    role: message.role === 'assistant' ? 'assistant' : 'user',
    ...(attachments.length ? { type: 'multipart' as const, content: parts } : { content }),
  }
}

/** Add runtime context to an isolated request, leaving canonical history untouched. */
export function withMemoryOverview(history: readonly SessionMessage[], overview?: string): SessionMessage[] {
  const messages = structuredClone(history) as SessionMessage[]
  if (overview === undefined) {
    return messages
  }

  const footer = `\n\n<runtime-memory>\n${overview}\n</runtime-memory>`
  const last = messages.at(-1)
  if (!last) {
    messages.push({ role: 'user', content: `Begin the task.${footer}` })
  } else if (last.role === 'user' && (!last.type || ['text', 'multipart', 'tool_result'].includes(last.type))) {
    if (Array.isArray(last.content)) {
      last.content.push({ type: 'text', text: footer })
    } else {
      last.content = (last.content ?? '') + footer
    }
  } else {
    messages.push({
      role: 'user',
      content: `Runtime context (LLMz):${footer}`,
    })
  }

  return messages
}

import { inspect } from './inspect.js'

const MAX_MESSAGE_LENGTH = 5000

export namespace Transcript {
  /**
   * A file attached to a transcript message.
   *
   * - `image`: a picture the model can see.
   * - `audio`: a voice message — spoken audio of what the user said. Messages
   *   carrying an audio attachment are presented to the model as spoken turns
   *   (tagged `modality="voice"` in the prompt) and the audio is sent as model
   *   input: audio-capable models hear it directly, others receive a
   *   transcription (see `@botpress/cognitive`'s `transcriptionModel` option).
   *
   * `url` supports http(s) URLs and base64 `data:` URIs.
   *
   * `id` is an optional stable identifier for referencing the attachment from
   * the message content (e.g. `screenshot-A` in a screen-share event log). It
   * is used as the attachment's reference in the prompt; without it, a
   * positional letter (A, B, C...) is auto-assigned.
   *
   * `alt` is an optional human-readable description shown to the model next to
   * the attachment (e.g. "Screenshot of the checkout error page").
   */
  export type Attachment = {
    type: 'image' | 'audio'
    url: string
    id?: string
    alt?: string
  }

  /**
   * How the user delivered a message. Defaults to `'text'`.
   *
   * Set to `'voice'` when the user spoke the message out loud. Use it when the
   * speech was already transcribed upstream and no audio is attached — the
   * message `content` is then treated as a transcript of what the user said.
   * Messages with an `audio` attachment are always treated as voice; setting
   * this field is not required for them.
   */
  export type Modality = 'text' | 'voice'

  export type AssistantMessage = {
    role: 'assistant'
    name?: string
    createdAt?: string
    content: string
  }

  export type UserMessage = {
    role: 'user'
    createdAt?: string
    name?: string
    content: string
    /** How the user delivered this message. Defaults to 'text'. See {@link Modality}. */
    modality?: Modality
    attachments?: Array<Attachment>
  }

  export type EventMessage = {
    role: 'event'
    createdAt?: string
    name: string
    payload: unknown
    attachments?: Array<Attachment>
  }

  export type SummaryMessage = {
    role: 'summary'
    content: string
    attachments?: Array<Attachment>
  }

  export type Message = AssistantMessage | UserMessage | EventMessage | SummaryMessage
}

function getMessagePreview(message: Transcript.Message) {
  if (message.role === 'assistant' || message.role === 'user' || message.role === 'summary') {
    return message.content
  }

  if (message.role === 'event') {
    return inspect(message.payload, message.name, { tokens: 1000 })
  }

  return inspect(message, undefined, { tokens: 1000 })
}

function getMessageType(message: Transcript.Message) {
  if (message.role === 'assistant' || message.role === 'user' || message.role === 'summary') {
    return message.role
  }

  if (message.role === 'event') {
    return `event:${message.name}`
  }

  return 'unknown'
}

/** Whether the message is a spoken turn: explicit voice modality or an audio attachment. */
export function isVoiceMessage(message: Transcript.Message): boolean {
  if (message.role === 'user' && message.modality === 'voice') {
    return true
  }
  if (message.role === 'user' || message.role === 'event') {
    return message.attachments?.some((attachment) => attachment.type === 'audio') ?? false
  }
  return false
}

export class TranscriptArray extends Array<Transcript.Message> {
  public constructor(items: Transcript.Message[] = []) {
    items = Array.isArray(items) ? items : []
    super(...items)

    items.forEach((item) => {
      if (!['user', 'assistant', 'event', 'summary'].includes(item.role)) {
        throw new Error(`Invalid role "${item.role}" in transcript message`)
      }

      if ('name' in item && item.name && typeof item.name !== 'string') {
        throw new Error(`Invalid name for transcript message. Expected a string, but got type "${typeof item.name}"`)
      }

      if ('content' in item && typeof item.content !== 'string') {
        throw new Error(
          `Invalid content for transcript message. Expected a string, but got type "${typeof item.content}"`
        )
      }

      if ('modality' in item && item.modality !== undefined && !['text', 'voice'].includes(item.modality)) {
        throw new Error(`Invalid modality "${item.modality}" in transcript message. Expected "text" or "voice"`)
      }
    })

    Object.setPrototypeOf(this, new.target.prototype)
  }

  public toString() {
    if (!this.length) {
      return ''
    }

    return this.map((item, idx) => {
      const msgIdx = getMessageType(item) + '-' + String(idx + 1).padStart(3, '0')
      let preview = getMessagePreview(item)

      if (preview.length > MAX_MESSAGE_LENGTH) {
        preview = preview.slice(0, MAX_MESSAGE_LENGTH) + '\n... (truncated)'
      }

      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

      if ((item.role === 'event' || item.role === 'user') && item.attachments?.length) {
        for (let i = 0; i < item.attachments.length; i++) {
          const attachment = item.attachments[i]!
          const ref = attachment.id ?? `${msgIdx}-${alphabet[i % alphabet.length]}`
          const alt = attachment.alt ? `: ${attachment.alt}` : ''
          preview += attachment.type === 'audio' ? `\n[Voice message ${ref}${alt}]` : `\n[Attachment ${ref}${alt}]`
        }
      }

      const tags: Array<{ key: string; value: string }> = []
      tags.push({ key: 'role', value: item.role })

      // Mark spoken turns so the modality stays visible even when the audio
      // attachment itself is no longer included in the prompt
      if (isVoiceMessage(item)) {
        tags.push({ key: 'modality', value: 'voice' })
      }

      if ('name' in item && item.name?.length) {
        tags.push({ key: 'name', value: item.name })
      }

      const tagsString = tags.map(({ key, value }) => `${key}="${value}"`).join(' ')
      return `<${msgIdx} ${tagsString}>\n${preview.trim()}\n</${msgIdx}>`
    }).join('\n')
  }
}

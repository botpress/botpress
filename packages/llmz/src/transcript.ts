import { inspect } from './inspect.js'

const MAX_MESSAGE_LENGTH = 5000

export namespace Transcript {
  export type Attachment = {
    type: 'image'
    url: string
  }

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

export class TranscriptArray extends Array<Transcript.Message> {
  public constructor(items: Transcript.Message[] = []) {
    items = Array.isArray(items) ? items : []
    super(...items)

    items.forEach((item) => {
      if (!['user', 'assistant'].includes(item.role)) {
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
          const attachmentIdx = alphabet[i % alphabet.length]
          preview += `\n[Attachment ${msgIdx}-${attachmentIdx}]`
        }
      }

      const tags: Array<{ key: string; value: string }> = []
      tags.push({ key: 'role', value: item.role })

      if ('name' in item && item.name?.length) {
        tags.push({ key: 'name', value: item.name })
      }

      const tagsString = tags.map(({ key, value }) => `${key}="${value}"`).join(' ')
      return `<${msgIdx} ${tagsString}>\n${preview.trim()}\n</${msgIdx}>`
    }).join('\n')
  }
}

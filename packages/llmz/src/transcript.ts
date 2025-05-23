export type TranscriptMessage = {
  role: 'user' | 'assistant'
  name?: string
  content: string
}

const MAX_MESSAGE_LENGTH = 5000

export class TranscriptArray extends Array<TranscriptMessage> {
  public constructor(items: TranscriptMessage[] = []) {
    items = Array.isArray(items) ? items : []
    super(...items)

    items.forEach((item) => {
      if (!['user', 'assistant'].includes(item.role)) {
        throw new Error(`Invalid role "${item.role}" in transcript message`)
      }

      if (item.name && typeof item.name !== 'string') {
        throw new Error(`Invalid name for transcript message. Expected a string, but got type "${typeof item.name}"`)
      }

      if (typeof item.content !== 'string') {
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
      const msgIdx = 'message-' + String(idx + 1).padStart(3, '0')
      const shouldTruncate = item.content.length > MAX_MESSAGE_LENGTH
      const preview = shouldTruncate ? item.content.slice(0, MAX_MESSAGE_LENGTH) + '\n... (truncated)' : item.content

      const tags: Array<{ key: string; value: string }> = []
      tags.push({ key: 'role', value: item.role })

      if (item.name?.length) {
        tags.push({ key: 'name', value: item.name })
      }

      const tagsString = tags.map(({ key, value }) => `${key}="${value}"`).join(' ')
      return `<${msgIdx} ${tagsString}>\n${preview.trim()}\n</${msgIdx}>`
    }).join('\n')
  }
}

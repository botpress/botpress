import { z } from '@bpinternal/zui'

export type TranscriptMessage = z.TypeOf<typeof TranscriptMessage>
export const TranscriptMessage = z.object({
  role: z.enum(['user', 'assistant']),
  name: z.string().optional(),
  content: z.string(),
})

export class TranscriptArray extends Array<TranscriptMessage> {
  public MAX_MESSAGE_LENGTH = 1000

  constructor(...items: TranscriptMessage[]) {
    super(...items)
    Object.setPrototypeOf(this, new.target.prototype)
  }

  toString() {
    if (!this.length) {
      return ''
    }

    return this.map((item, idx) => {
      const msgIdx = 'message-' + String(idx + 1).padStart(3, '0')
      const shouldTruncate = item.content.length > this.MAX_MESSAGE_LENGTH
      const preview = shouldTruncate
        ? item.content.slice(0, this.MAX_MESSAGE_LENGTH) + '\n... (truncated)'
        : item.content

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

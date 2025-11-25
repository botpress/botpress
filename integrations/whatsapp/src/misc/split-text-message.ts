import { Text } from 'whatsapp-api-js/messages'

const WHATSAPP_MAX_TEXT_LENGTH = 4096

export type OutgoingTextMessage = Text

export function splitTextMessageIfNeeded(message: string): OutgoingTextMessage[] {
  const textLength = message.length
  if (textLength <= WHATSAPP_MAX_TEXT_LENGTH) {
    return [new Text(message)]
  }

  const numChunks = Math.ceil(textLength / WHATSAPP_MAX_TEXT_LENGTH)
  const chunks = Array.from({ length: numChunks }, (_, i) => {
    const start = i * WHATSAPP_MAX_TEXT_LENGTH
    const end = (i + 1) * WHATSAPP_MAX_TEXT_LENGTH
    const chunk = new Text(message.slice(start, end))
    return chunk
  })

  return chunks
}

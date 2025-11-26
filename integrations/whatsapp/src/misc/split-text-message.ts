const WHATSAPP_MAX_TEXT_LENGTH = 4096

export function splitTextMessageIfNeeded(message: string): string[] {
  const textLength = message.length
  if (textLength <= WHATSAPP_MAX_TEXT_LENGTH) {
    return [message]
  }

  const numChunks = Math.ceil(textLength / WHATSAPP_MAX_TEXT_LENGTH)
  const chunks = Array.from({ length: numChunks }, (_, i) => {
    const start = i * WHATSAPP_MAX_TEXT_LENGTH
    const end = (i + 1) * WHATSAPP_MAX_TEXT_LENGTH
    return message.slice(start, end)
  })

  return chunks
}

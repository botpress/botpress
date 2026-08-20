const WHATSAPP_MAX_TEXT_LENGTH = 4096

export function splitTextMessageIfNeeded(message: string): string[] {
  const textLength = message.length
  if (textLength <= WHATSAPP_MAX_TEXT_LENGTH) {
    return [message]
  }

  const chunks: string[] = []
  let start = 0

  while (start < textLength) {
    let end = Math.min(start + WHATSAPP_MAX_TEXT_LENGTH, textLength)
    const lastCodeUnit = message.charCodeAt(end - 1)
    if (end < textLength && lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff) {
      end--
    }
    chunks.push(message.slice(start, end))
    start = end
  }

  return chunks
}

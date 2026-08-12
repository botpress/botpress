export const SUNCO_MAX_TEXT_LENGTH = 4096

export function splitTextMessageIfNeeded(message: string): string[] {
  if (message.length <= SUNCO_MAX_TEXT_LENGTH) {
    return [message]
  }

  const chunks: string[] = []
  let start = 0

  while (start < message.length) {
    let end = Math.min(start + SUNCO_MAX_TEXT_LENGTH, message.length)

    // Avoid splitting a Unicode surrogate pair between messages.
    if (end < message.length && _isHighSurrogate(message.charCodeAt(end - 1))) {
      end--
    }

    chunks.push(message.slice(start, end))
    start = end
  }

  return chunks
}

function _isHighSurrogate(charCode: number): boolean {
  return charCode >= 0xd800 && charCode <= 0xdbff
}

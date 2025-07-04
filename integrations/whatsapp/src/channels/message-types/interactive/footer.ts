import { convertMarkdownToWhatsApp } from 'src/misc/markdown-to-whatsapp-rtf'
import { Footer } from 'whatsapp-api-js/messages'

const MAX_LENGTH = 60

export function create(text: string) {
  return new Footer(convertMarkdownToWhatsApp(text.substring(0, MAX_LENGTH)))
}

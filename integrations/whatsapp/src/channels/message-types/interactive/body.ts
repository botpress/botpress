import { Body } from 'whatsapp-api-js/messages'
import { convertMarkdownToWhatsApp } from '../../../misc/markdown-to-whatsapp-rtf'

const MAX_LENGTH = 1024

export function create(text: string) {
  return new Body(convertMarkdownToWhatsApp(text).substring(0, MAX_LENGTH))
}

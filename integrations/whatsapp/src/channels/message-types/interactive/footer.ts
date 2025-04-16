import { Footer } from 'whatsapp-api-js/messages'

const MAX_LENGTH = 60

export function create(text: string) {
  return new Footer(text.substring(0, MAX_LENGTH))
}

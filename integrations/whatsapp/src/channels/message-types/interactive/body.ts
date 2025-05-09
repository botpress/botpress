import { Body } from 'whatsapp-api-js/messages'

const MAX_LENGTH = 1024

export function create(text: string) {
  return new Body(text.substring(0, MAX_LENGTH))
}

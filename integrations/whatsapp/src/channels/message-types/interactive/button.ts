import { Button } from 'whatsapp-api-js/messages'

const ID_MAX_LENGTH = 256
const TITLE_MAX_LENGTH = 20

export function create({ id, title }: { id: string; title: string }) {
  return new Button(id.substring(0, ID_MAX_LENGTH), title.substring(0, TITLE_MAX_LENGTH))
}

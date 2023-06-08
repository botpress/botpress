import { Types } from 'whatsapp-api-js'

const ID_MAX_LENGTH = 256
const TITLE_MAX_LENGTH = 20

export function create({ id, title }: { id: string; title: string }) {
  return new Types.Interactive.Button(id.substring(0, ID_MAX_LENGTH), title.substring(0, TITLE_MAX_LENGTH))
}

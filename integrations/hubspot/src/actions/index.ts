import { createTicket } from './create-ticket'
import { searchContact } from './searchContact'
import * as bp from '.botpress'

export default {
  searchContact,
  createTicket,
} as const satisfies bp.IntegrationProps['actions']

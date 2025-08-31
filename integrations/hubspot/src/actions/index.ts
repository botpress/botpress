import { createTicket } from './create-ticket'
import { searchContact } from './search-contact'
import * as bp from '.botpress'

export default {
  searchContact,
  createTicket,
} as const satisfies bp.IntegrationProps['actions']

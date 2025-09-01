import { createTicket } from './create-ticket'
import { searchContact } from './search-contact'
import { searchLead } from './searchLead'
import * as bp from '.botpress'

export default {
  searchContact,
  createTicket,
  searchLead,
} as const satisfies bp.IntegrationProps['actions']

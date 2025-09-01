import * as contactActions from './contact'
import { createTicket } from './create-ticket'
import { searchLead } from './searchLead'
import * as bp from '.botpress'

export default {
  ...contactActions,
  createTicket,
  searchLead,
} as const satisfies bp.IntegrationProps['actions']

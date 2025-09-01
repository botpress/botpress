import * as contactActions from './contact'
import { createTicket } from './create-ticket'
import * as bp from '.botpress'

export default {
  ...contactActions,
  createTicket,
} as const satisfies bp.IntegrationProps['actions']

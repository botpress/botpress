import * as contactActions from './contact'
import { createTicket } from './create-ticket'
import * as dealActions from './deal'
import * as leadActions from './lead'
import * as bp from '.botpress'

export default {
  createTicket,
  ...contactActions,
  ...dealActions,
  ...leadActions,
} as const satisfies bp.IntegrationProps['actions']

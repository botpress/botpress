import * as contactActions from './contact'
import { createTicket } from './create-ticket'
import * as dealActions from './deal'
import * as leadActions from './lead'
import * as bp from '.botpress'

export default {
  ...contactActions,
  ...dealActions,
  ...leadActions,
  createTicket,
} as const satisfies bp.IntegrationProps['actions']

import * as companyActions from './company'
import * as contactActions from './contact'
import * as dealActions from './deal'
import { createUser, startHitl, stopHitl } from './hitl'
import * as leadActions from './lead'
import * as ticketActions from './ticket'
import * as bp from '.botpress'

export default {
  ...contactActions,
  ...dealActions,
  ...ticketActions,
  ...leadActions,
  ...companyActions,
  createUser,
  startHitl,
  stopHitl,
} as const satisfies bp.IntegrationProps['actions']

import { actions as companyActions } from './company'
import { actions as contactActions } from './contact'
import { actions as dealActions } from './deal'
import { actions as leadActions } from './lead'
import { actions as ticketActions } from './ticket'

export const actions = {
  ...contactActions,
  ...ticketActions,
  ...dealActions,
  ...leadActions,
  ...companyActions,
} as const

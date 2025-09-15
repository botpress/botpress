import { actions as personActions } from './actions/person'
import { actions as dealActions } from './actions/deal'
import { actions as leadActions } from './actions/lead'

export const actions = {
  ...personActions,
  ...dealActions,
  ...leadActions,
} as const
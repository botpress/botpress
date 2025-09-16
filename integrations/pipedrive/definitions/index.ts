import { actions as personActions } from './actions/person'
import { actions as dealActions } from './actions/deal'
import { actions as leadActions } from './actions/lead'
import { actions as activityActions } from './actions/activity'

export const actions = {
  ...personActions,
  ...dealActions,
  ...leadActions,
  ...activityActions
} as const
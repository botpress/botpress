import { actions as personActions } from './actions/person'
import { actions as dealActions } from './actions/deal'
import { actions as leadActions } from './actions/lead'
import { actions as activityActions } from './actions/activity'
import { actions as noteActions } from './actions/note'

export const actions = {
  ...personActions,
  ...dealActions,
  ...leadActions,
  ...activityActions,
  ...noteActions
} as const
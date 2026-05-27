import { actions as personActions } from './actions/person'

export const actions = {
  ...personActions,
} as const

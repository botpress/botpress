import { actions as contactActions } from './profile'
import { actions as listActions } from './list'

export const actions = {
  ...contactActions,
  ...listActions,
} as const

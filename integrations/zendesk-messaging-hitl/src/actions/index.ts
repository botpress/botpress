import { startHitl, stopHitl, createUser } from './hitl'
import * as bp from '.botpress'

export const actions = {
  startHitl,
  stopHitl,
  createUser,
} satisfies bp.IntegrationProps['actions']

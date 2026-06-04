import { startHitl, stopHitl, createUser } from './hitl'
import * as bp from '.botpress'

export default {
  startHitl,
  stopHitl,
  createUser,
} satisfies bp.IntegrationProps['actions']

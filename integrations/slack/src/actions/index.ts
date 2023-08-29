import { addReaction } from './add-reaction'
import { findTarget } from './find-target'
import { retrieveMessage } from './retreive-message'
import * as bp from '.botpress'

export default {
  addReaction,
  findTarget,
  retrieveMessage,
} satisfies bp.IntegrationProps['actions']

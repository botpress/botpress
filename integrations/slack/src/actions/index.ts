import { addReaction } from './add-reaction'
import { findTarget } from './find-target'
import { syncMembers } from './list-users'
import { retrieveMessage } from './retreive-message'
import { startDmConversation } from './start-dm'

import * as bp from '.botpress'

export default {
  addReaction,
  findTarget,
  retrieveMessage,
  syncMembers,
  startDmConversation,
} satisfies bp.IntegrationProps['actions']

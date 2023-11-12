import { addReaction } from './add-reaction'
import { findTarget } from './find-target'
import { listActiveMembers } from './list-users'
import { retrieveMessage } from './retreive-message'
import { startDmConversation } from './start-dm'

import * as bp from '.botpress'

export default {
  addReaction,
  findTarget,
  retrieveMessage,
  listActiveMembers,
  startDmConversation,
} satisfies bp.IntegrationProps['actions']

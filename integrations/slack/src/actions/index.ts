import { addReaction } from './add-reaction'
import { findTarget } from './find-target'
import { syncMembers } from './list-users'
import { retrieveMessage } from './retreive-message'
import { startDmConversation } from './start-dm'
import { updateChannelTopic } from './update-channel-topic'

import * as bp from '.botpress'

export default {
  addReaction,
  findTarget,
  retrieveMessage,
  syncMembers,
  startDmConversation,
  updateChannelTopic,
} satisfies bp.IntegrationProps['actions']

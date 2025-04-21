import { addReaction } from './add-reaction'
import { createReplyThread } from './create-reply-thread'
import { findTarget } from './find-target'
import { retrieveMessage } from './retrieve-message'
import { startDmConversation } from './start-dm'
import { syncMembers } from './sync-members'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import { updateChannelTopic } from './update-channel-topic'

import * as bp from '.botpress'

export default {
  addReaction,
  findTarget,
  retrieveMessage,
  syncMembers,
  startDmConversation,
  updateChannelTopic,
  startTypingIndicator,
  stopTypingIndicator,
  createReplyThread,
} satisfies bp.IntegrationProps['actions']

import type * as bp from '.botpress'
import { addReaction } from './add-reaction'
import { findTarget } from './find-target'
import { getUserProfile } from './get-user-profile'
import { retrieveMessage } from './retrieve-message'
import { startDmConversation } from './start-dm'
import { syncMembers } from './sync-members'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import { updateChannelTopic } from './update-channel-topic'

export default {
  addReaction,
  findTarget,
  retrieveMessage,
  syncMembers,
  startDmConversation,
  updateChannelTopic,
  startTypingIndicator,
  stopTypingIndicator,
  getUserProfile,
} satisfies bp.IntegrationProps['actions']

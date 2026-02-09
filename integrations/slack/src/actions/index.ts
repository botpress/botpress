import { addConversationContext } from './add-conversation-context'
import { addReaction } from './add-reaction'
import { findTarget } from './find-target'
import { getConversationContextByConversationId, getConversationContextByTags } from './get-conversation-context'
import { getUserProfile } from './get-user-profile'
import { retrieveMessage } from './retrieve-message'
import { startChannelConversation } from './start-channel-conversation'
import { startDmConversation } from './start-dm-conversation'
import { startThreadConversation } from './start-thread-conversation'
import { syncMembers } from './sync-members'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import { updateChannelTopic } from './update-channel-topic'
import type * as bp from '.botpress'

export default {
  addConversationContext,
  addReaction,
  findTarget,
  getConversationContextByConversationId,
  getConversationContextByTags,
  retrieveMessage,
  syncMembers,
  startDmConversation,
  startChannelConversation,
  startThreadConversation,
  updateChannelTopic,
  startTypingIndicator,
  stopTypingIndicator,
  getUserProfile,
} satisfies bp.IntegrationProps['actions']

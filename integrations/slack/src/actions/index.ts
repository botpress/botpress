import { addReaction } from './add-reaction'
import { findTarget } from './find-target'
import { getChannelsInfo } from './get-channels-info'
import { getOrCreateChannelConversation } from './get-or-create-channel-conversation'
import { getOrCreateConversation } from './get-or-create-conversation'
import { getOrCreateDmConversation } from './get-or-create-dm-conversation'
import { getUserProfile } from './get-user-profile'
import { retrieveMessage } from './retrieve-message'
import { syncMembers } from './sync-members'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import { updateChannelTopic } from './update-channel-topic'
import type * as bp from '.botpress'

export default {
  addReaction,
  findTarget,
  getChannelsInfo,
  getOrCreateChannelConversation,
  getOrCreateConversation,
  getOrCreateDmConversation,
  retrieveMessage,
  syncMembers,
  updateChannelTopic,
  startTypingIndicator,
  stopTypingIndicator,
  getUserProfile,
} satisfies bp.IntegrationProps['actions']

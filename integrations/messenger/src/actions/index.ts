import getOrCreateConversation from './proactive-conversation'
import getOrCreateUser from './proactive-user'
import dmConversationFromComment from './dm-conversation-from-comment'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import * as bp from '.botpress'

export default {
  dmConversationFromComment,
  startTypingIndicator,
  stopTypingIndicator,
  getOrCreateConversation,
  getOrCreateUser,
} satisfies bp.IntegrationProps['actions']

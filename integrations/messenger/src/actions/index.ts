import getOrCreateConversation from './proactive-conversation'
import getOrCreateUser from './proactive-user'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import * as bp from '.botpress'

export default {
  startTypingIndicator,
  stopTypingIndicator,
  getOrCreateConversation,
  getOrCreateUser,
} satisfies bp.IntegrationProps['actions']

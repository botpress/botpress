import { getOrCreateConversation } from './get-or-create-conversation'
import { getOrCreateUser } from './get-or-create-user'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import * as bp from '.botpress'

export const actions = {
  startTypingIndicator,
  stopTypingIndicator,
  getOrCreateUser,
  getOrCreateConversation,
} satisfies bp.IntegrationProps['actions']

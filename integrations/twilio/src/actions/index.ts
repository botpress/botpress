import * as bp from '../../.botpress'
import { getOrCreateUser } from './get-or-create-user'
import { startConversation } from './start-conversation'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'

export const actions = {
  getOrCreateUser,
  startConversation,
  startTypingIndicator,
  stopTypingIndicator,
} satisfies bp.IntegrationProps['actions']

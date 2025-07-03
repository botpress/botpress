import { startDmConversation } from './start-dm'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import * as bp from '.botpress'

export default {
  startTypingIndicator,
  stopTypingIndicator,
  startDmConversation,
} satisfies bp.IntegrationProps['actions']

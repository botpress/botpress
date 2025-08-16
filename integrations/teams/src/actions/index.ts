import { addReaction } from './add-reaction'
import { startDmConversation } from './start-dm'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import * as bp from '.botpress'

export default {
  startTypingIndicator,
  stopTypingIndicator,
  startDmConversation,
  addReaction,
} satisfies bp.IntegrationProps['actions']

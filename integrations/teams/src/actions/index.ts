import { addReactions } from './add-reactions'
import { startDmConversation } from './start-dm'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import * as bp from '.botpress'

export default {
  startTypingIndicator,
  stopTypingIndicator,
  startDmConversation,
  addReactions,
} satisfies bp.IntegrationProps['actions']

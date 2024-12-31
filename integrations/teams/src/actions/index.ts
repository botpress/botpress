import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import * as bp from '.botpress'

export default {
  startTypingIndicator,
  stopTypingIndicator,
} satisfies bp.IntegrationProps['actions']

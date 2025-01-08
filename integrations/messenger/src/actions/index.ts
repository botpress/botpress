import { startTypingIndicator, stopTypingIndicator } from 'src/actions/typing-indicator'
import * as bp from '.botpress'

export default {
  startTypingIndicator,
  stopTypingIndicator,
} satisfies bp.IntegrationProps['actions']

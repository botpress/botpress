import { listTemplates } from './list-templates'
import { startConversation, sendTemplateMessage } from './start-conversation'
import { startTypingIndicator, stopTypingIndicator } from './typing-indicator'
import { startFlow } from './start-flow'
import * as bp from '.botpress'

export default {
  startConversation,
  sendTemplateMessage,
  listTemplates,
  startFlow,
  startTypingIndicator,
  stopTypingIndicator,
} as const satisfies bp.IntegrationProps['actions']


import { createConversationSession } from './create-conversation-session'
import { endConversationSession } from './end-conversation-session'
import { getConversationFromSession } from './get-conversation-from-session'
import { startChat } from './start-chat'
import { IntegrationProps } from '.botpress'

export default {
  createConversationSession,
  startChat,
  endConversationSession,
  getConversationFromSession,
} satisfies IntegrationProps['actions']

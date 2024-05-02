
import { createConversationSession } from './create-conversation-session'
import { endConversationSession } from './end-conversation-session'
import { listenConversation } from './listen-conversation'
import { startChat } from './start-chat'
import { sendMessage } from './send-message'
import { IntegrationProps } from '.botpress'

export default {
  createConversationSession,
  startChat,
  listenConversation,
  endConversationSession,
  sendMessage
} satisfies IntegrationProps['actions']

import * as bp from '.botpress'
import { createConversation } from './create-conversation'
import { getCreateUser } from './get-create-user'
import { sendMessage } from './send-message'

export default {
  createConversation,
  getCreateUser,
  sendMessage
} satisfies bp.IntegrationProps['actions']

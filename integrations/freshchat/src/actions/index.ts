import * as bp from '.botpress'
import { createConversation } from './create-conversation'
import { getCreateUser } from './get-create-user'
import { sendMessage } from './send-message'
import { listenConversation } from './listen-conversation'
import { updateConversation } from './update-conversation'

export default {
  createConversation,
  updateConversation,
  listenConversation,
  getCreateUser,
  sendMessage
} satisfies bp.IntegrationProps['actions']

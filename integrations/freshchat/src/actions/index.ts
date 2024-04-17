import * as bp from '.botpress'
import { createConversation } from './create-conversation'
import { getCreateUser } from './get-create-user'

export default {
  createConversation,
  getCreateUser
} satisfies bp.IntegrationProps['actions']

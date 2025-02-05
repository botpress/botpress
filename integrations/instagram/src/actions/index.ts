import { getOrCreateConversationDm } from './proactive-conversation'
import { getOrCreateUser } from './proactive-user'
import * as bp from '.botpress'

export default {
  getOrCreateUser,
  getOrCreateConversationDm,
} satisfies bp.IntegrationProps['actions']

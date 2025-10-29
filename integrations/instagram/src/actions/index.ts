import { getOrCreateConversation } from './proactive-conversation'
import { getOrCreateUser } from './proactive-user'
import * as bp from '.botpress'

export default {
  getOrCreateUser,
  getOrCreateConversation,
} satisfies bp.IntegrationProps['actions']

import { getOrCreateUser } from './proactive-user'
import { getOrCreateConversation } from './proactive-conversation'
import * as bp from '.botpress'

export const actions = {
  getOrCreateUser,
  getOrCreateConversation,
} satisfies bp.IntegrationProps['actions']

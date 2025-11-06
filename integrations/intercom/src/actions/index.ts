import { getOrCreateConversation } from './proactive-conversation'
import { getOrCreateUser } from './proactive-user'
import * as bp from '.botpress'

export const actions = {
  getOrCreateConversation,
  getOrCreateUser,
} satisfies bp.IntegrationProps['actions']

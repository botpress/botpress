import * as bp from '.botpress'
import { getOrCreateConversation } from './proactive-conversation'
import { getOrCreateUser } from './proactive-user'

export const actions = {
  getOrCreateConversation,
  getOrCreateUser,
} satisfies bp.IntegrationProps['actions']

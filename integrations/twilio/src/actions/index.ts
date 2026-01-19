import * as bp from '../../.botpress'
import { getOrCreateUser } from './get-or-create-user'
import { startConversation } from './start-conversation'

export const actions = {
  getOrCreateUser,
  startConversation,
} satisfies bp.IntegrationProps['actions']

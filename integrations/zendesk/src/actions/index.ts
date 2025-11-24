import { callApi } from './call-api'
import { closeTicket } from './close-ticket'
import { createTicket } from './create-ticket'
import { createUser } from './create-user'
import { findCustomer } from './find-customer'
import { getOrCreateMessagingConversation } from './get-or-create-messaging-conversation'
import { getOrCreateMessagingUser } from './get-or-create-messaging-user'
import { getTicket } from './get-ticket'
import { startHitl, stopHitl } from './hitl'
import { listAgents } from './list-agents'
import { startTypingIndicator } from './start-typing-indicator'
import { stopTypingIndicator } from './stop-typing-indicator'
import { syncKb } from './sync-kb'
import * as bp from '.botpress'

export default {
  getTicket,
  findCustomer,
  createTicket,
  createUser,
  closeTicket,
  listAgents,
  callApi,
  startHitl,
  stopHitl,
  syncKb,
  startTypingIndicator,
  stopTypingIndicator,
  getOrCreateMessagingUser,
  getOrCreateMessagingConversation,
} satisfies bp.IntegrationProps['actions']

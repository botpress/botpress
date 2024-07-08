import { closeTicket } from './close-ticket'
import { createTicket } from './create-ticket'
import { createUser } from './create-user'
import { findCustomer } from './find-customer'
import { getTicket } from './get-ticket'
import { getTicketConversation } from './get-ticket-conversation'
import { listAgents } from './list-agents'
import { openTicket } from './open-ticket'
import { setConversationRequester } from './set-conversation-requester'
import * as bp from '.botpress'

export default {
  getTicket,
  findCustomer,
  createTicket,
  createUser,
  closeTicket,
  listAgents,
  getTicketConversation,
  setConversationRequester,
  openTicket,
} satisfies bp.IntegrationProps['actions']

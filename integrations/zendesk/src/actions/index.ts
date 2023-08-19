import { closeTicket } from './close-ticket'
import { createTicket } from './create-ticket'
import { findCustomer } from './find-customer'
import { getTicket } from './get-ticket'
import { listAgents } from './list-agents'
import { startTicketConversation } from './start-ticket-conversation'
import { IntegrationProps } from '.botpress'

export default {
  getTicket,
  findCustomer,
  createTicket,
  closeTicket,
  listAgents,
  startTicketConversation,
} satisfies IntegrationProps['actions']

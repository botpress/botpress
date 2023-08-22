import { closeTicket } from './close-ticket'
import { createTicket } from './create-ticket'
import { findCustomer } from './find-customer'
import { getTicket } from './get-ticket'
import { getTicketConversation } from './get-ticket-conversation'
import { listAgents } from './list-agents'
import { IntegrationProps } from '.botpress'

export default {
  getTicket,
  findCustomer,
  createTicket,
  closeTicket,
  listAgents,
  getTicketConversation,
} satisfies IntegrationProps['actions']

import { addNote } from './addNote'
import { replyToTicket } from './replyToTicket'
import { createTicket } from './createTicket'
import { deleteTicket } from './deleteTicket'
import { getContact } from './getContact'
import { getTicket } from './getTicket'
import { listTickets } from './listTickets'
import { searchContacts } from './searchContacts'
import { searchTickets } from './searchTickets'
import { updateTicket } from './updateTicket'
import * as bp from '.botpress'

export default {
  addNote,
  replyToTicket,
  createTicket,
  deleteTicket,
  getContact,
  getTicket,
  listTickets,
  searchContacts,
  searchTickets,
  updateTicket,

  createUser: async (_props) => {
    // 1. get-or-create the user in the external service (freshdesk)
    // 2. get-or-create the user in botpress and link it to the external user via tags
    // 3. return the botpress user id
    return { userId: '123456' }
  },
  startHitl: async (_props) => {
    // 1. get-or-create the ticket in the external service (freshdesk) that will be used for the HITL session
    // 2. get-or-create the conversation in botpress and link it to the external ticket via tags
    // 3. return the conversation id to start the HITL session
    return { conversationId: '123456' }
  },
  stopHitl: async (_props) => {
    // close the ticket in the external service (freshdesk) that is used for the HITL session
    return {}
  },
} as const satisfies bp.IntegrationProps['actions']

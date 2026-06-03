import { addNote } from './addNote'
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
  createTicket,
  deleteTicket,
  getContact,
  getTicket,
  listTickets,
  searchContacts,
  searchTickets,
  updateTicket,
} as const satisfies bp.IntegrationProps['actions']

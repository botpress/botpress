import { addNote } from './addNote'
import { createTicket } from './createTicket'
import { createUser } from './createUser'
import { deleteTicket } from './deleteTicket'
import { getContact } from './getContact'
import { getTicket } from './getTicket'
import { listTickets } from './listTickets'
import { searchContacts } from './searchContacts'
import { searchTickets } from './searchTickets'
import { startHitl } from './startHitl'
import { stopHitl } from './stopHitl'
import { updateTicket } from './updateTicket'
import * as bp from '.botpress'

export default {
  addNote,
  createTicket,
  createUser,
  deleteTicket,
  getContact,
  getTicket,
  listTickets,
  searchContacts,
  searchTickets,
  startHitl,
  stopHitl,
  updateTicket,
} as const satisfies bp.IntegrationProps['actions']

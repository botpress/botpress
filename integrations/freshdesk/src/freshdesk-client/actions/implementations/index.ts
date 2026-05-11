import { createTicket } from './createTicket'
import { deleteTicket } from './deleteTicket'
import { getTicket } from './getTicket'
import { listTickets } from './listTickets'
import { searchTickets } from './searchTickets'
import { updateTicket } from './updateTicket'
import * as bp from '.botpress'

export default {
  createTicket,
  deleteTicket,
  getTicket,
  listTickets,
  searchTickets,
  updateTicket,
} as const satisfies bp.IntegrationProps['actions']

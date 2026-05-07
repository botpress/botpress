import {
  createContact,
  deleteContacts,
  listContactFields,
  listContacts,
  searchContacts,
  updateContacts,
} from './contacts'
import { getCurrentUser } from './current-user'
import { createLead, deleteLeads, listLeadFields, listLeads, searchLeads, updateLeads } from './leads'
import { createTicket, deleteTickets, getTicketFields, getTickets, searchTickets, updateTickets } from './tickets'
import * as bp from '.botpress'

export default {
  getCurrentUser,
  listContactFields,
  listLeadFields,
  getTicketFields,
  searchLeads,
  searchTickets,
  listLeads,
  getTickets,
  createLead,
  createTicket,
  updateLeads,
  updateTickets,
  deleteLeads,
  deleteTickets,
  searchContacts,
  listContacts,
  createContact,
  updateContacts,
  deleteContacts,
} as const satisfies bp.IntegrationProps['actions']

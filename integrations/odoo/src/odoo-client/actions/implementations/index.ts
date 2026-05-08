import {
  createContact,
  deleteContacts,
  getContactFields,
  getContacts,
  searchContacts,
  updateContacts,
} from './contacts'
import { getCurrentUser } from './current-user'
import { createLead, deleteLeads, getLeadFields, getLeads, searchLeads, updateLeads } from './leads'
import * as bp from '.botpress'

export default {
  getCurrentUser,
  getContactFields,
  getLeadFields,
  searchLeads,
  getLeads,
  createLead,
  updateLeads,
  deleteLeads,
  searchContacts,
  getContacts,
  createContact,
  updateContacts,
  deleteContacts,
} as const satisfies bp.IntegrationProps['actions']

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
import * as bp from '.botpress'

export default {
  getCurrentUser,
  listContactFields,
  listLeadFields,
  searchLeads,
  listLeads,
  createLead,
  updateLeads,
  deleteLeads,
  searchContacts,
  listContacts,
  createContact,
  updateContacts,
  deleteContacts,
} as const satisfies bp.IntegrationProps['actions']

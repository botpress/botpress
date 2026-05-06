import { createContact } from './createContact'
import { createLead } from './createLead'
import { deleteContacts } from './deleteContacts'
import { deleteLeads } from './deleteLeads'
import { getContactFields } from './getContactFields'
import { getContacts } from './getContacts'
import { getCurrentUser } from './getCurrentUser'
import { getLeadFields } from './getLeadFields'
import { getLeads } from './getLeads'
import { searchContacts } from './searchContacts'
import { searchLeads } from './searchLeads'
import { updateContacts } from './updateContacts'
import { updateLeads } from './updateLeads'
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

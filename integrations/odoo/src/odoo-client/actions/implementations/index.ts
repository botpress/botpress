import { createContact } from './createContact'
import { deleteContacts } from './deleteContacts'
import { getContactFields } from './getContactFields'
import { getContacts } from './getContacts'
import { getCurrentUser } from './getCurrentUser'
import { searchContacts } from './searchContacts'
import { updateContacts } from './updateContacts'
import * as bp from '.botpress'

export default {
  getCurrentUser,
  getContactFields,
  searchContacts,
  getContacts,
  createContact,
  updateContacts,
  deleteContacts,
} as const satisfies bp.IntegrationProps['actions']

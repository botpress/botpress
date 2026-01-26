import * as bp from '.botpress'
import { createLead, updateLead, createContact, searchContacts, searchLeads } from './actions'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},

  actions: {
    createLead,
    updateLead,
    searchLeads,
    createContact,
    searchContacts,
  },
  channels: {},
  handler: async () => {},
})

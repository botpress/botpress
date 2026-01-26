import { createLead, updateLead, createContact, searchContacts, searchLeads } from './actions'
import * as bp from '.botpress'

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

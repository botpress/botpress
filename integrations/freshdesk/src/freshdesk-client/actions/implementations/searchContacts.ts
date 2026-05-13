import { wrapAction } from '../action-wrapper'

export const searchContacts = wrapAction(
  { actionName: 'searchContacts', errorMessage: 'Failed to search Freshdesk contacts' },
  async ({ freshdeskClient }, input) => {
    if (input.email) {
      const contacts = await freshdeskClient.searchContactsByEmail(input.email)
      return {
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email ?? null,
          phone: c.phone ?? null,
          company_id: c.company_id ?? null,
        })),
      }
    }

    if (input.name) {
      const results = await freshdeskClient.searchContactsByName(input.name)
      return {
        contacts: results.map((c) => ({
          id: c.id,
          name: c.name,
          email: null,
          phone: null,
          company_id: null,
        })),
      }
    }

    return { contacts: [] }
  }
)

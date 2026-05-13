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
      const contacts = await Promise.all(
        results.map(async (r) => {
          const contact = await freshdeskClient.getContact(r.id)
          return {
            id: contact.id,
            name: contact.name,
            email: contact.email ?? null,
            phone: contact.phone ?? null,
            company_id: contact.company_id ?? null,
          }
        })
      )
      return { contacts }
    }

    return { contacts: [] }
  }
)

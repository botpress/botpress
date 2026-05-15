import { wrapAction } from '../action-wrapper'

// Name search (autocomplete) returns results without email/phone;
// each needs a separate getContact call to fill in those missing fields.
// Cap at 5 to avoid unbounded API requests.
const MAX_NAME_ENRICHMENT = 5

export const searchContacts = wrapAction(
  { actionName: 'searchContacts', errorMessage: 'Failed to search Freshdesk contacts' },
  async ({ freshdeskClient }, input) => {
    const page = input.nextToken ? Math.max(1, parseInt(input.nextToken, 10) || 1) : 1

    if (input.email) {
      const contacts = await freshdeskClient.searchContactsByEmail(input.email, page)
      // Freshdesk returns up to 30 contacts per page
      const nextToken = contacts.length === 30 ? String(page + 1) : undefined
      return {
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email ?? null,
          phone: c.phone ?? null,
          companyId: c.company_id ?? null,
        })),
        nextToken,
      }
    }

    if (input.name) {
      // Autocomplete endpoint has no pagination
      const results = await freshdeskClient.searchContactsByName(input.name)
      const settled = await Promise.allSettled(
        results.slice(0, MAX_NAME_ENRICHMENT).map(async (r) => {
          const contact = await freshdeskClient.getContact(r.id)
          return {
            id: contact.id,
            name: contact.name,
            email: contact.email ?? null,
            phone: contact.phone ?? null,
            companyId: contact.company_id ?? null,
          }
        })
      )
      const contacts = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value)
      return { contacts }
    }

    return { contacts: [] }
  }
)

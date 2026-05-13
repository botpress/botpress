import { wrapAction } from '../action-wrapper'

export const getContact = wrapAction(
  { actionName: 'getContact', errorMessage: 'Failed to get Freshdesk contact' },
  async ({ freshdeskClient }, input) => {
    const contact = await freshdeskClient.getContact(parseInt(input.contactId, 10))
    return {
      id: contact.id,
      name: contact.name,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      mobile: contact.mobile ?? null,
      company_id: contact.company_id ?? null,
      tags: contact.tags ?? null,
      createdAt: contact.created_at,
    }
  }
)

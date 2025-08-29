import { getAuthenticatedHubspotClient, propertiesEntriesToRecord } from '../utils'
import * as bp from '.botpress'

export const searchContact: bp.IntegrationProps['actions']['searchContact'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client })

  const phoneStr = input.phone ? `phone ${input.phone}` : 'unknown phone'
  const emailStr = input.email ? `email ${input.email}` : 'unknown email'
  const infosStr = `${phoneStr} and ${emailStr}`
  logger
    .forBot()
    .debug(
      `Searching for contact with ${infosStr} ${input.properties?.length ? `and properties ${input.properties?.join(', ')}` : ''}`
    )

  const contact = await hsClient.searchContact({
    phone: input.phone,
    email: input.email,
    propertiesToReturn: input.properties,
  })

  return {
    contact,
  }
}

export const createContact: bp.IntegrationProps['actions']['createContact'] = async ({ ctx, client, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client })
  const { email, phone, owner, companies, tickets, properties } = input
  const additionalProperties = propertiesEntriesToRecord(properties ?? [])
  const newContact = await hsClient.createContact({
    email,
    phone,
    ownerEmailOrId: owner,
    companies,
    ticketIds: tickets,
    additionalProperties,
  })
  return {
    contact: {
      id: newContact.contactId,
      properties: newContact.properties,
    },
  }
}

export const getContact: bp.IntegrationProps['actions']['getContact'] = async ({ ctx, client, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client })
  const contact = await hsClient.getContact({
    contactId: input.contactIdOrEmail,
    propertiesToReturn: input.properties ?? [],
  })
  return {
    contact: {
      id: contact.contactId,
      properties: contact.properties,
    },
  }
}

export const updateContact: bp.IntegrationProps['actions']['updateContact'] = async ({ ctx, client, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client })
  const { contactIdOrEmail, phone, email, properties } = input
  const additionalProperties = propertiesEntriesToRecord(properties ?? [])
  const updatedContact = await hsClient.updateContact({
    contactId: contactIdOrEmail,
    additionalProperties,
    email,
    phone,
  })
  return {
    contact: {
      id: updatedContact.contactId,
      properties: updatedContact.properties,
    },
  }
}

export const deleteContact: bp.IntegrationProps['actions']['deleteContact'] = async ({ ctx, client, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client })
  await hsClient.deleteContact({
    contactId: input.contactId,
  })
  return {}
}

export const listContacts: bp.IntegrationProps['actions']['listContacts'] = async ({ ctx, client, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client })
  const { contacts, nextToken } = await hsClient.listContacts({
    properties: input.properties,
    nextToken: input.meta.nextToken,
  })
  return {
    contacts,
    meta: {
      nextToken,
    },
  }
}

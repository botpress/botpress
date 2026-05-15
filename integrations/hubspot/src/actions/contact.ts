import { z } from '@botpress/sdk'
import { contactSchema } from '../../definitions/actions/contact'
import { getAuthenticatedHubspotClient, propertiesEntriesToRecord } from '../utils'
import * as bp from '.botpress'

type HubspotClient = Awaited<ReturnType<typeof getAuthenticatedHubspotClient>>
type HsContact = Awaited<ReturnType<HubspotClient['getContact']>>
type BpContact = z.infer<typeof contactSchema>

const _mapHsContactToBpContact = (hsContact: HsContact): BpContact => ({
  id: hsContact.id,
  properties: hsContact.properties,
  email: hsContact.properties['email'] ?? '',
  phone: hsContact.properties['phone'] ?? '',
  createdAt: hsContact.createdAt.toISOString(),
  updatedAt: hsContact.updatedAt.toISOString(),
})

const _getContactPropertyKeys = async (hsClient: HubspotClient) => {
  const properties = await hsClient.getAllObjectProperties('contacts')
  return properties.results.map((property) => property.name)
}

export const searchContact: bp.IntegrationProps['actions']['searchContact'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })

  const phoneStr = input.phone ? `phone ${input.phone}` : 'unknown phone'
  const emailStr = input.email ? `email ${input.email}` : 'unknown email'
  const infosStr = `${phoneStr} and ${emailStr}`
  const propertyKeys = await _getContactPropertyKeys(hsClient)
  logger
    .forBot()
    .debug(
      `Searching for contact with ${infosStr} ${propertyKeys?.length ? `and properties ${propertyKeys?.join(', ')}` : ''}`
    )

  const contact = await hsClient.searchContact({
    phone: input.phone,
    email: input.email,
    propertiesToReturn: propertyKeys,
  })

  if (!contact) {
    return {
      contact: undefined,
    }
  }

  return {
    contact: _mapHsContactToBpContact(contact),
  }
}

export const createContact: bp.IntegrationProps['actions']['createContact'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })
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
    contact: _mapHsContactToBpContact(newContact),
  }
}

export const getContact: bp.IntegrationProps['actions']['getContact'] = async ({ ctx, client, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })

  const propertyKeys = await _getContactPropertyKeys(hsClient)
  const contact = await hsClient.getContact({
    contactId: input.contactIdOrEmail,
    propertiesToReturn: propertyKeys,
  })
  return {
    contact: _mapHsContactToBpContact(contact),
  }
}

export const updateContact: bp.IntegrationProps['actions']['updateContact'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })
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
      ..._mapHsContactToBpContact(updatedContact),
      email: updatedContact.properties['email'] ?? undefined,
      phone: updatedContact.properties['phone'] ?? undefined,
    },
  }
}

export const deleteContact: bp.IntegrationProps['actions']['deleteContact'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })
  await hsClient.deleteContact({
    contactId: input.contactId,
  })
  return {}
}

export const listContacts: bp.IntegrationProps['actions']['listContacts'] = async ({ ctx, client, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })
  const propertyKeys = await _getContactPropertyKeys(hsClient)
  const { contacts, nextToken } = await hsClient.listContacts({
    properties: propertyKeys,
    nextToken: input.meta.nextToken,
  })
  return {
    contacts: contacts.map(_mapHsContactToBpContact),
    meta: {
      nextToken,
    },
  }
}

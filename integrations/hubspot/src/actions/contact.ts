import { z } from '@botpress/sdk'
import { contactSchema } from '../../definitions/actions/contact'
import { buildContactUrl, getAuthenticatedHubspotClient, getOrFetchPortalId, propertiesEntriesToRecord } from '../utils'
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
  const propertyKeys = input.properties?.length ? input.properties : await _getContactPropertyKeys(hsClient)
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

  const portalId = await getOrFetchPortalId({ client, ctx, hsClient })
  return {
    contact: _mapHsContactToBpContact(contact),
    url: buildContactUrl({ portalId, contactId: contact.id }),
  }
}

export const listContactProperties: bp.IntegrationProps['actions']['listContactProperties'] = async ({
  ctx,
  client,
  logger,
}) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })
  try {
    const properties = await hsClient.listContactProperties()
    return {
      properties: properties.map((property) => ({
        name: property.name,
        label: property.label,
        type: property.type,
        fieldType: property.fieldType,
        groupName: property.groupName,
        description: property.description,
        ...(property.referencedObjectType ? { referencedObjectType: property.referencedObjectType } : {}),
      })),
    }
  } catch (err: unknown) {
    logger.forBot().debug(`Contact properties could not be retrieved: ${err}`)
    return { properties: [] }
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
  const [contact, portalId] = await Promise.all([
    hsClient.getContact({
      contactId: input.contactIdOrEmail,
      propertiesToReturn: propertyKeys,
    }),
    getOrFetchPortalId({ client, ctx, hsClient }),
  ])
  return {
    contact: _mapHsContactToBpContact(contact),
    url: buildContactUrl({ portalId, contactId: contact.id }),
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

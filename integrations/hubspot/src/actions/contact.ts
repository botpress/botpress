import { getAccessToken } from '../auth'
import { HubspotClient } from '../hubspot-api'
import * as bp from '.botpress'

const _getHubspotClient = async ({ ctx, client }: { ctx: bp.Context; client: bp.Client }) => {
  return new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })
}

const _toPropertiesRecord = (properties: { name: string; value: string }[]) => {
  return Object.fromEntries(properties.map(({ name, value }) => [name, value]))
}

export const searchContact: bp.IntegrationProps['actions']['searchContact'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const hsClient = await _getHubspotClient({ ctx, client })

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
    propertiesToReturn: input.properties ?? [],
  })

  return {
    contact,
  }
}

export const createContact: bp.IntegrationProps['actions']['createContact'] = async ({ ctx, client, input }) => {
  const hsClient = await _getHubspotClient({ ctx, client })
  const { email, phone, additionalProperties } = input
  const properties = _toPropertiesRecord(additionalProperties ?? [])
  const newContact = await hsClient.createContact({
    email,
    phone,
    additionalProperties: properties,
  })
  return {
    contact: {
      id: newContact.contactId,
      properties: newContact.properties,
    },
  }
}

export const getContact: bp.IntegrationProps['actions']['getContact'] = async ({ ctx, client, input }) => {
  const hsClient = await _getHubspotClient({ ctx, client })
  const contact = await hsClient.getContact({
    contactId: input.contactId,
  })
  return {
    contact: {
      id: contact.contactId,
      properties: contact.properties,
    },
  }
}

export const updateContact: bp.IntegrationProps['actions']['updateContact'] = async ({ ctx, client, input }) => {
  const hsClient = await _getHubspotClient({ ctx, client })
  const { contactId, phone, email, additionalProperties: additionalPropertiesInput } = input
  const additionalProperties = _toPropertiesRecord(additionalPropertiesInput ?? [])
  const updatedContact = await hsClient.updateContact({
    contactId,
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
  const hsClient = await _getHubspotClient({ ctx, client })
  await hsClient.deleteContact({
    contactId: input.contactId,
  })
  return {}
}

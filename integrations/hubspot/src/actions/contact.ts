import { getAccessToken } from '../auth'
import { HubspotClient } from '../hubspot-api'
import * as bp from '.botpress'

export const searchContact: bp.IntegrationProps['actions']['searchContact'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

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
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })
  const newContact = await hsClient.createContact({
    email: input.email,
    phone: input.phone,
    properties: input.properties ?? {},
  })
  return {
    contact: {
      id: newContact.contactId,
      properties: newContact.properties,
    },
  }
}

export const getContact: bp.IntegrationProps['actions']['getContact'] = async ({ ctx, client, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })
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

export const updateContact: bp.IntegrationProps['actions']['updateContact'] = async () => {
  // TODO: Implement
  return {
    contact: {
      id: '',
      properties: {},
    },
  }
}

export const deleteContact: bp.IntegrationProps['actions']['deleteContact'] = async () => {
  // TODO: Implement
  return {
    contact: {
      id: '',
      properties: {},
    },
  }
}

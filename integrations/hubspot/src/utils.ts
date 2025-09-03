import { getAccessToken } from './auth'
import { HubspotClient } from './hubspot-api'
import * as bp from '.botpress'

export const getAuthenticatedHubspotClient = async ({ ctx, client }: { ctx: bp.Context; client: bp.Client }) => {
  return new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })
}

export const propertiesEntriesToRecord = (properties: { name: string; value: string }[]) => {
  return Object.fromEntries(properties.map(({ name, value }) => [name, value]))
}

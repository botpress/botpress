import { isApiError } from '@botpress/sdk'
import { getAccessToken } from './auth'
import { HubspotClient } from './hubspot-api'
import * as bp from '.botpress'

export const getAuthenticatedHubspotClient = async ({
  ctx,
  client,
  logger,
}: {
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
}) => {
  return new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx, logger })
}

export const propertiesEntriesToRecord = (properties: { name: string; value: string }[]) => {
  return Object.fromEntries(properties.map(({ name, value }) => [name, value]))
}

export const setPortalId = async ({
  client,
  ctx,
  portalId,
}: {
  client: bp.Client
  ctx: bp.Context
  portalId: string
}) => {
  await client.setState({
    type: 'integration',
    name: 'hubInfo',
    id: ctx.integrationId,
    payload: { portalId },
  })
}

export const getOrFetchPortalId = async ({
  client,
  ctx,
  hsClient,
}: {
  client: bp.Client
  ctx: bp.Context
  hsClient: HubspotClient
}): Promise<string> => {
  const cached = await client
    .getState({ type: 'integration', name: 'hubInfo', id: ctx.integrationId })
    .then((s) => s.state.payload.portalId)
    .catch((e: unknown) => {
      if (isApiError(e) && e.code === 404) {
        return undefined
      }
      throw e
    })
  if (cached) {
    return cached
  }
  const portalId = await hsClient.getHubId()
  await setPortalId({ client, ctx, portalId })
  return portalId
}

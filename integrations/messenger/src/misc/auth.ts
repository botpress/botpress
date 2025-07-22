import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'
import { Oauth as OAuthState } from '.botpress/implementation/typings/states/oauth'

export async function getMessengerClientCredentials(
  client: bp.Client,
  ctx: bp.Context
): Promise<{ accessToken: string; clientSecret: string; clientId: string }> {
  if (ctx.configurationType === 'manual') {
    return {
      accessToken: ctx.configuration.accessToken || '',
      clientSecret: ctx.configuration.clientSecret || '',
      clientId: ctx.configuration.clientId || '',
    }
  }

  // Otherwise use the page token obtained from the OAuth flow and stored in the state
  const { state } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })

  if (!state.payload.pageToken) {
    throw new Error('There is no access token, please reauthorize')
  }

  return {
    accessToken: state.payload.pageToken,
    clientSecret: bp.secrets.CLIENT_SECRET,
    clientId: bp.secrets.CLIENT_ID,
  }
}

export async function getPartialMetaClientCredentials(client: bp.Client, ctx: bp.Context) {
  return await client
    .getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })
    .then((result) => result.state.payload)
}

export async function getMetaClientCredentials(client: bp.Client, ctx: bp.Context) {
  const { accessToken, pageToken, pageId } = await getPartialMetaClientCredentials(client, ctx)
  if (!accessToken || !pageToken || !pageId) {
    throw new RuntimeError('Access token, page token, or page ID is missing, please reauthorize')
  }
  return { accessToken, pageToken, pageId }
}

// client.patchState is not working correctly
export async function patchMetaClientCredentials(
  client: bp.Client,
  ctx: bp.Context,
  newState: Partial<OAuthState['payload']>
) {
  const currentState = await getPartialMetaClientCredentials(client, ctx).catch(() => ({}))

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      ...currentState,
      ...newState,
    },
  })
}

export function getVerifyToken(ctx: bp.Context): string {
  // Should normally be verified in the fallbackHandler script with OAuth and Sandbox
  let verifyToken: string
  if (ctx.configurationType === 'manual') {
    verifyToken = ctx.configuration.verifyToken
  } else {
    verifyToken = bp.secrets.VERIFY_TOKEN
  }

  return verifyToken
}

export function getClientSecret(ctx: bp.Context): string | undefined {
  let value: string | undefined
  if (ctx.configurationType === 'manual') {
    value = ctx.configuration.clientSecret
  } else {
    value = bp.secrets.CLIENT_SECRET
  }

  return value?.length ? value : undefined
}

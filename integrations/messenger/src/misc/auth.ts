import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'
import { Oauth as OAuthState } from '.botpress/implementation/typings/states/oauth'

type MessengerClientCredentials = {
  accessToken: string
  clientSecret: string
  clientId: string
}

export async function getMessengerClientCredentials(
  client: bp.Client,
  ctx: bp.Context
): Promise<MessengerClientCredentials> {
  let credentials: MessengerClientCredentials
  if (ctx.configurationType === 'manual') {
    credentials = {
      accessToken: ctx.configuration.accessToken,
      clientSecret: ctx.configuration.clientSecret ?? '',
      clientId: ctx.configuration.clientId,
    }
  } else if (ctx.configurationType === 'sandbox') {
    credentials = {
      accessToken: bp.secrets.SANDBOX_ACCESS_TOKEN,
      clientSecret: bp.secrets.SANDBOX_CLIENT_SECRET,
      clientId: bp.secrets.SANDBOX_CLIENT_ID,
    }
  } else {
    const { state } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })

    if (!state.payload.pageToken) {
      throw new RuntimeError('There is no access token, please reauthorize')
    }

    credentials = {
      accessToken: state.payload.pageToken,
      clientSecret: bp.secrets.CLIENT_SECRET,
      clientId: bp.secrets.CLIENT_ID,
    }
  }

  return credentials
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
  } else if (ctx.configurationType === 'sandbox') {
    verifyToken = bp.secrets.SANDBOX_VERIFY_TOKEN
  } else {
    verifyToken = bp.secrets.VERIFY_TOKEN
  }

  return verifyToken
}

export function getClientSecret(ctx: bp.Context): string | undefined {
  let value: string | undefined
  if (ctx.configurationType === 'manual') {
    value = ctx.configuration.clientSecret
  } else if (ctx.configurationType === 'sandbox') {
    value = bp.secrets.SANDBOX_CLIENT_SECRET
  } else {
    value = bp.secrets.CLIENT_SECRET
  }

  return value?.length ? value : undefined
}

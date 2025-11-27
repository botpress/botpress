import { RuntimeError } from '@botpress/sdk'
import {
  MessengerClientCredentials,
  FacebookClientCredentials,
  MetaClientCredentials,
  MetaClientConfigType,
} from './types'
import * as bp from '.botpress'
import { Oauth as OAuthState } from '.botpress/implementation/typings/states/oauth'

export async function getMessengerClientCredentials(
  client: bp.Client,
  ctx: bp.Context
): Promise<MessengerClientCredentials> {
  let credentials: MessengerClientCredentials
  const clientSecret = getClientSecret(ctx)
  if (ctx.configurationType === 'manual') {
    credentials = {
      accessToken: ctx.configuration.accessToken,
      clientSecret,
      clientId: ctx.configuration.clientId,
    }
  } else if (ctx.configurationType === 'sandbox') {
    credentials = {
      accessToken: bp.secrets.SANDBOX_ACCESS_TOKEN,
      clientSecret,
      clientId: bp.secrets.SANDBOX_CLIENT_ID,
    }
  } else {
    const {
      state: {
        payload: { pageToken },
      },
    } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })

    if (!pageToken) {
      throw new RuntimeError('No page token found, please reauthorize')
    }

    credentials = {
      accessToken: pageToken,
      clientSecret,
      clientId: bp.secrets.CLIENT_ID,
    }
  }

  return credentials
}

export async function getFacebookClientCredentials(
  client: bp.Client,
  ctx: bp.Context
): Promise<FacebookClientCredentials> {
  let credentials: FacebookClientCredentials
  if (ctx.configurationType === 'manual') {
    credentials = {
      pageId: ctx.configuration.pageId,
      pageToken: ctx.configuration.accessToken,
    }
  } else {
    const {
      state: {
        payload: { pageToken, pageId },
      },
    } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })
    if (!pageToken || !pageId) {
      throw new RuntimeError('No page token or page id found, please reauthorize')
    }
    credentials = {
      pageId,
      pageToken,
    }
  }

  return credentials
}

type WritableOAuthMetaClientCredentials = Partial<Omit<OAuthState['payload'], 'accessToken'>> & { userToken?: string }
async function _getWritableOAuthMetaClientCredentials(
  client: bp.Client,
  ctx: bp.Context
): Promise<WritableOAuthMetaClientCredentials> {
  return await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId }).then((result) => ({
    ...result.state.payload,
    userToken: result.state.payload.accessToken,
  }))
}

export async function getOAuthMetaClientCredentials(
  client: bp.Client,
  ctx: bp.Context
): Promise<MetaClientCredentials> {
  const { userToken, pageToken, pageId } = await _getWritableOAuthMetaClientCredentials(client, ctx)
  return {
    userToken,
    pageToken,
    pageId,
    clientId: bp.secrets.CLIENT_ID,
    clientSecret: bp.secrets.CLIENT_SECRET,
    appToken: bp.secrets.ACCESS_TOKEN,
  }
}

// `client.patchState` is not working correctly
export async function patchOAuthMetaClientCredentials(
  client: bp.Client,
  ctx: bp.Context,
  credentials: WritableOAuthMetaClientCredentials
) {
  const {
    state: { payload: currentState },
  } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })
  const { userToken, ...credentialsWithoutUserToken } = credentials
  const newState: OAuthState['payload'] = credentialsWithoutUserToken
  if (userToken) {
    newState.accessToken = userToken
  }

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

export async function getMetaClientCredentials({
  configType: explicitConfigType,
  client,
  ctx,
}: {
  configType?: MetaClientConfigType
  client: bp.Client
  ctx: bp.Context
}): Promise<MetaClientCredentials> {
  const configType: MetaClientConfigType = explicitConfigType ?? ctx.configurationType

  let credentials: MetaClientCredentials | undefined
  if (configType === 'sandbox') {
    throw new RuntimeError('Meta client credentials are not available for sandbox configuration')
  } else if (configType === 'manual') {
    if (ctx.configurationType !== configType) {
      throw new RuntimeError(
        'Meta client credentials for manual configuration only available when configured with manual configuration'
      )
    }
    credentials = {
      pageToken: ctx.configuration.accessToken,
      pageId: ctx.configuration.pageId,
      clientId: ctx.configuration.clientId,
      clientSecret: ctx.configuration.clientSecret,
    }
  } else if (configType === 'oauth' || configType === null) {
    credentials = await getOAuthMetaClientCredentials(client, ctx)
  }

  if (!credentials) {
    throw new RuntimeError('Could not get Meta client credentials')
  }

  return credentials
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

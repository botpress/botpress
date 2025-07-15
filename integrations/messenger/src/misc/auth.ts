import * as bp from '.botpress'

export async function getMessengerClientCredentials(
  client: bp.Client,
  ctx: bp.Context
): Promise<{ accessToken: string; clientSecret: string; clientId: string }> {
  if (ctx.configurationType === 'manualApp') {
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

export function getVerifyToken(ctx: bp.Context): string {
  // Should normally be verified in the fallbackHandler script with OAuth and Sandbox
  let verifyToken: string
  if (ctx.configurationType === 'manualApp') {
    verifyToken = ctx.configuration.verifyToken
  } else {
    verifyToken = bp.secrets.VERIFY_TOKEN
  }

  return verifyToken
}

export function getClientSecret(ctx: bp.Context): string | undefined {
  let value: string | undefined
  if (ctx.configurationType === 'manualApp') {
    value = ctx.configuration.clientSecret
  } else {
    value = bp.secrets.CLIENT_SECRET
  }

  return value?.length ? value : undefined
}

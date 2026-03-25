import * as sdk from '@botpress/sdk'
import { StoredCredentials } from './types'
import * as bp from '.botpress'

export const getStoredCredentials = async (
  client: bp.Client,
  ctx: bp.HandlerProps['ctx']
): Promise<StoredCredentials> => {
  const {
    state: { payload: credentials },
  } = await client.getOrSetState({
    name: 'credentials',
    type: 'integration',
    id: ctx.integrationId,
    payload: {},
  })

  const { token, appId, subdomain } = credentials

  if (!token || !appId) {
    throw new sdk.RuntimeError('failed to get stored access token or app ID')
  }

  return { token, appId, subdomain }
}

export const getWebhookSecret = async (client: bp.Client, ctx: bp.HandlerProps['ctx']) => {
  const {
    state: {
      payload: { secret },
    },
  } = await client.getOrSetState({
    name: 'webhook',
    type: 'integration',
    id: ctx.integrationId,
    payload: { id: '', secret: '' },
  })
  if (!secret) {
    throw new sdk.RuntimeError('Error: the webhook secret was not found in the bot state.')
  }
  return secret
}

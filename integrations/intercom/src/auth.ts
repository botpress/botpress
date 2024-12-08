import { RuntimeError, z } from '@botpress/sdk'
import axios from 'axios'
import { Client as IntercomClient } from 'intercom-client'
import * as bp from '.botpress'

export const getAuthenticatedIntercomClient = async (client: bp.Client, ctx: bp.Context): Promise<IntercomClient> => {
  if (ctx.configurationType === 'manual') {
    return new IntercomClient({ tokenAuth: { token: ctx.configuration.accessToken } })
  }

  const { state } = await client.getState({
    id: ctx.integrationId,
    name: 'credentials',
    type: 'integration',
  })
  const { accessToken } = state.payload
  return new IntercomClient({ tokenAuth: { token: accessToken } })
}

const saveAccessToken = async (client: bp.Client, ctx: bp.Context, accessToken: string): Promise<void> => {
  await client.setState({
    id: ctx.integrationId,
    name: 'credentials',
    type: 'integration',
    payload: { accessToken },
  })
}

const exchangeCodeForAccessToken = async (code: string): Promise<string> => {
  const response = await axios.post('https://api.intercom.io/auth/eagle/token', {
    code,
    client_id: bp.secrets.CLIENT_ID,
    client_secret: bp.secrets.CLIENT_SECRET,
  })
  const responseSchema = z.object({
    access_token: z.string(),
  })
  const accessToken = responseSchema.safeParse(response.data).data?.access_token
  if (!accessToken) {
    throw new RuntimeError('Failed to exchange code for access token')
  }
  return accessToken
}

export const getSignatureSecret = (ctx: bp.Context): string => {
  if (ctx.configurationType === 'manual') {
    return ctx.configuration.clientSecret
  }
  return bp.secrets.CLIENT_SECRET
}

export const handleOAuth = async ({ client, ctx, req }: bp.HandlerProps): Promise<void> => {
  console.info('Handling OAuth callback')
  const code = new URLSearchParams(req.query).get('code')
  if (!code) {
    throw new RuntimeError('Code not present in OAuth callback request')
  }
  const accessToken = await exchangeCodeForAccessToken(code)
  await saveAccessToken(client, ctx, accessToken)
  await client.configureIntegration({
    identifier: ctx.configuration.adminId,
  })
}

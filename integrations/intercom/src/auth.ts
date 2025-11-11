import { RuntimeError, z } from '@botpress/sdk'
import axios from 'axios'
import { Client as IntercomClient } from 'intercom-client'
import * as bp from '.botpress'

export const getAuthenticatedIntercomClient = async (client: bp.Client, ctx: bp.Context): Promise<IntercomClient> => {
  // TODO: Change null for 'manual' once the Intercom app is approved
  if (ctx.configurationType === null) {
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

const saveAuthCredentials = async (
  client: bp.Client,
  ctx: bp.Context,
  { accessToken, adminId }: { accessToken: string; adminId: string }
): Promise<void> => {
  await client.setState({
    id: ctx.integrationId,
    name: 'credentials',
    type: 'integration',
    payload: { accessToken, adminId },
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

export const getSignatureSecret = (ctx: bp.Context): string | undefined => {
  // TODO: Change null for 'manual' once the Intercom app is approved
  if (ctx.configurationType === null) {
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
  const adminId = await getAdminId(ctx)
  await saveAuthCredentials(client, ctx, { accessToken, adminId })
  await client.configureIntegration({ identifier: adminId })
}

const responseSchema = z.object({
  type: z.string(),
  id: z.string(),
})

export const getAdminId = async (ctx: bp.Context): Promise<string> => {
  const response = await axios.get('https://api.intercom.io/me', {
    headers: {
      Authorization: `Bearer ${ctx.configuration.accessToken}`,
    },
  })

  const parsedResponse = responseSchema.safeParse(response.data)
  if (!parsedResponse.success) {
    throw new RuntimeError('Failed to parse admin ID from response')
  }
  return parsedResponse.data.id
}

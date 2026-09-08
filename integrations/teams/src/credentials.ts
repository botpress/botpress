import { isApiError, RuntimeError } from '@botpress/sdk'
import axios, { isAxiosError } from 'axios'
import type { TeamsConfig } from 'definitions'
import * as bp from '.botpress'

const _getLegacyManualConfig = (ctx: bp.Context): TeamsConfig | undefined => {
  const config = ctx.configuration as unknown
  if (!config || typeof config !== 'object') {
    return undefined
  }

  const { appId, appPassword, tenantId } = config as Record<string, unknown>
  if (typeof appId === 'string' && typeof appPassword === 'string') {
    return { appId, appPassword, tenantId: typeof tenantId === 'string' ? tenantId : undefined }
  }

  return undefined
}

export const getCredentials = async ({
  client,
  ctx,
}: {
  client: bp.Client
  ctx: bp.Context
}): Promise<TeamsConfig> => {
  const stored = await client
    .getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
    .then(({ state }) => state.payload)
    .catch((e: unknown) => {
      if (isApiError(e) && e.type === 'ResourceNotFound') {
        return undefined
      }
      throw e
    })

  if (stored) {
    return stored
  }

  const legacyConfig = _getLegacyManualConfig(ctx)
  if (legacyConfig) {
    return legacyConfig
  }

  throw new RuntimeError('Microsoft Teams is not configured. Please run the setup wizard.')
}

export const validateCredentials = async (credentials: TeamsConfig): Promise<void> => {
  const tenant = credentials.tenantId ?? 'botframework.com'

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: credentials.appId,
    client_secret: credentials.appPassword,
    tenant_id: tenant,
    scope: 'https://api.botframework.com/.default',
  })

  await axios.post(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, params.toString()).catch((e) => {
    const message = isAxiosError(e) ? e.response?.data?.error_description : e.message
    throw new RuntimeError(`Failed to authenticate with Microsoft Teams: ${message}`)
  })
}

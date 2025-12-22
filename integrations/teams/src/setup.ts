import { RuntimeError } from '@botpress/sdk'
import axios, { isAxiosError } from 'axios'
import * as bp from '.botpress'

export const register: bp.Integration['register'] = async ({ ctx }) => {
  const tenant = ctx.configuration.tenantId ?? 'botframework.com'

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: ctx.configuration.appId,
    client_secret: ctx.configuration.appPassword,
    tenant_id: tenant,
    scope: 'https://api.botframework.com/.default',
  })

  await axios.post(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, params.toString()).catch((e) => {
    const message = isAxiosError(e) ? e.response?.data?.error_description : e.message
    throw new RuntimeError(`Failed to authenticate with Microsoft Teams: ${message}`)
  })
}

export const unregister: bp.Integration['unregister'] = async () => {}

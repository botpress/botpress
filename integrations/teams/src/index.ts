import { RuntimeError } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import axios, { isAxiosError } from 'axios'
import actions from './actions'
import { channels } from './channels'
import { handler } from './handler'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async ({ ctx }) => {
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
  },
  unregister: async () => {},
  actions,
  channels,
  handler,
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

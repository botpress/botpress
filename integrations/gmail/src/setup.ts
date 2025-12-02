import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME } from 'integration.definition'
import { GoogleClient } from './google-api'
import * as bp from '.botpress'

const posthogConfig = {
  integrationName: INTEGRATION_NAME,
  key: (bp.secrets as any).POSTHOG_KEY as string,
}

export const register: bp.IntegrationProps['register'] = async ({ client, ctx }) => {
  const startTime = Date.now()

  const googleClient =
    ctx.configurationType === 'customApp'
      ? await GoogleClient.createFromAuthorizationCode({
          client,
          ctx,
          authorizationCode: ctx.configuration.oauthAuthorizationCode,
        })
      : await GoogleClient.create({ client, ctx })

  await googleClient.watchIncomingMail()

  const configurationTimeMs = Date.now() - startTime

  await posthogHelper
    .sendPosthogEvent(
      {
        distinctId: ctx.integrationId,
        event: 'integration_registered',
        properties: {
          botId: ctx.botId,
          configurationType: ctx.configurationType,
          configurationTimeMs,
        },
      },
      posthogConfig
    )
    .catch(() => {
      // Silently fail if PostHog is unavailable
    })
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx }) => {
  await posthogHelper
    .sendPosthogEvent(
      {
        distinctId: ctx.integrationId,
        event: 'integration_unregistered',
        properties: {
          botId: ctx.botId,
        },
      },
      posthogConfig
    )
    .catch(() => {})
}

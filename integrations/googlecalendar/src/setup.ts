import { GoogleClient } from './google-api/google-client'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ logger, ctx, client }) => {
  logger.forBot().info('Registering Google Calendar integration')

  const googleClient = await GoogleClient.createFromAuthorizationCode({
    ctx,
    client,
    authorizationCode: ctx.configuration.oauthAuthorizationCode,
  })

  const summary = await googleClient.getCalendarSummary()

  logger.forBot().info(`Successfully connected to Google Calendar: ${summary}`)
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

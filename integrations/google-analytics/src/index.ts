import { RuntimeError } from '@botpress/sdk'
import { GoogleAnalyticsClient, parseError, parseJsonObject } from './client'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    try {
      await getClient(ctx).validateConfiguration()
      logger.forBot().info('Google Analytics integration configured successfully')
    } catch (error) {
      throw new RuntimeError(`Failed to configure Google Analytics integration: ${parseError(error)}`)
    }
  },
  unregister: async ({ logger }) => {
    logger.forBot().info('Google Analytics integration unregistered')
  },
  actions: {
    trackNode: async ({ ctx, input, logger }) => {
      logger.forBot().info(`Tracking Google Analytics page view for node "${input.nodeId}"`)

      try {
        await getClient(ctx).trackEvent(input.userId, 'page_view', {
          page_title: input.nodeId,
        })
        logger.forBot().info(`Tracked Google Analytics page view for node "${input.nodeId}"`)
        return {}
      } catch (error) {
        throw new RuntimeError(`Failed to track node "${input.nodeId}" in Google Analytics: ${parseError(error)}`)
      }
    },
    trackEvent: async ({ ctx, input, logger }) => {
      logger.forBot().info(`Tracking Google Analytics event "${input.eventName}"`)

      try {
        const eventPayload = parseJsonObject(input.eventPayload, 'eventPayload')

        await getClient(ctx).trackEvent(input.userId, input.eventName, eventPayload)
        logger.forBot().info(`Tracked Google Analytics event "${input.eventName}"`)
        return {}
      } catch (error) {
        throw new RuntimeError(`Failed to track event "${input.eventName}" in Google Analytics: ${parseError(error)}`)
      }
    },
    updateUserProfile: async ({ ctx, input, logger }) => {
      logger.forBot().info(`Updating Google Analytics user profile for "${input.userId}"`)

      try {
        const userProfile = parseJsonObject(input.userProfile, 'userProfile')

        await getClient(ctx).updateUserProfile(input.userId, userProfile)
        logger.forBot().info(`Updated Google Analytics user profile for "${input.userId}"`)
        return {}
      } catch (error) {
        throw new RuntimeError(
          `Failed to update user profile for "${input.userId}" in Google Analytics: ${parseError(error)}`
        )
      }
    },
  },
  channels: {},
  handler: async () => {},
})

function getClient(ctx: bp.Context): GoogleAnalyticsClient {
  const { measurementId, apiSecret } = ctx.configuration

  if (!measurementId || !apiSecret) {
    throw new RuntimeError('Google Analytics Measurement ID and API Secret are required.')
  }

  return new GoogleAnalyticsClient(measurementId, apiSecret)
}

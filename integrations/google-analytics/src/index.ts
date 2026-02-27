import * as botpress from '.botpress'
import * as bpclient from '@botpress/client'
import axios from 'axios'

export default new botpress.Integration({
  register: async ({ ctx }) => {
    // Check if Measurement ID and API Secret are set
    if (!ctx.configuration.measurementId || !ctx.configuration.apiSecret) {
      throw new bpclient.RuntimeError(
        'Configuration Error! The Google Analytics Measurement ID and/or API Secret is not set. Please set it in your bot integration configuration.'
      )
    }

    // Prepare endpoint and payload for a test event to validate the API credentials
    const endpoint = `https://www.google-analytics.com/debug/mp/collect?measurement_id=${ctx.configuration.measurementId}&api_secret=${ctx.configuration.apiSecret}`
    const payload = {
      client_id: 'test-client-id',
      events: [
        {
          name: 'test_event',
          params: {
            test_param: 1,
          },
        },
      ],
    }

    try {
      // Making a test request to the debug endpoint
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Check the response to see if it was successful, if not throw an error
      if (!response.data || response.data.error) {
        throw new Error('Invalid Measurement ID or API Secret')
      }

      console.log('Google Analytics configuration is valid.') // Success message
    } catch (error) {
      throw new bpclient.RuntimeError('Configuration Error! Invalid Google Analytics Measurement ID or API Secret.')
    }
  },
  unregister: async () => {},
  actions: {
    trackNode: async (args) => {
      args.logger.forBot().info('Tracking data for node:', args.input.nodeId)
      try {
        await axios.post(
          `https://www.google-analytics.com/mp/collect?measurement_id=${args.ctx.configuration.measurementId}&api_secret=${args.ctx.configuration.apiSecret}`,
          {
            client_id: args.input.userId,
            events: [
              {
                name: 'page_view',
                params: {
                  page_title: args.input.nodeId,
                },
              },
            ],
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        args.logger.forBot().info('Tracked Node successfully')
        return {}
      } catch (error) {
        args.logger.forBot().error('Error during Google Analytics node tracking', error)
        return {}
      }
    },
    trackEvent: async (args) => {
      args.logger.forBot().info('Tracking data for event:', args.input.eventName)
      let eventPayload = {}

      try {
        if (args.input.eventPayload) {
          eventPayload = JSON.parse(args.input.eventPayload)
        }
      } catch (error) {
        args.logger.forBot().error('Invalid JSON as eventPayload. Must be JSON stringifiable', error)
        return {}
      }

      try {
        await axios.post(
          `https://www.google-analytics.com/mp/collect?measurement_id=${args.ctx.configuration.measurementId}&api_secret=${args.ctx.configuration.apiSecret}`,
          {
            client_id: args.input.userId,
            events: [
              {
                name: args.input.eventName,
                params: eventPayload,
              },
            ],
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        args.logger.forBot().info('Tracked Event successfully')
        return {}
      } catch (error) {
        args.logger.forBot().error('Error during Google Analytics event tracking', error)
        return {}
      }
    },
    updateUserProfile: async (args) => {
      args.logger.forBot().info('Updating user profile in Google Analytics for user:', args.input.userId)

      let userProfile = {}

      try {
        if (args.input.userProfile) {
          userProfile = JSON.parse(args.input.userProfile)
        }
      } catch (error) {
        args.logger.forBot().error('Invalid JSON as userProfile. Must be JSON stringifiable', error)
        return {}
      }

      const eventParams = {
        ...userProfile,
        engagement_time_msec: 1, // Minimal engagement time to count the user as active
      }

      const measurementId = args.ctx.configuration.measurementId
      const apiSecret = args.ctx.configuration.apiSecret
      const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`

      const payload = {
        client_id: args.input.userId,
        events: [
          {
            name: 'update_user_profile',
            params: eventParams,
          },
        ],
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      }

      try {
        await axios.post(endpoint, payload, config)
        args.logger.forBot().info('User profile updated successfully')
        return {}
      } catch (error) {
        args.logger.forBot().error('Error during Google Analytics user profile update', error)
        return {}
      }
    },
  },
  channels: {},
  handler: async () => {},
})

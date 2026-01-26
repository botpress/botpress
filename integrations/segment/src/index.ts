import * as botpress from '.botpress'
import Analytics from 'analytics-node'
import * as bpclient from '@botpress/client'
import axios from 'axios'

type updateUserProfileOutput = botpress.actions.updateUserProfile.output.Output
type trackNodeOutput = botpress.actions.trackNode.output.Output
type trackEventOutput = botpress.actions.trackEvent.output.Output

export default new botpress.Integration({
  register: async ({ ctx }) => {
    // check if key is valid

    if (!ctx.configuration.writeKey) {
      throw new bpclient.RuntimeError(
        'Configuration Error! The Segment write key is not set. Please set it in your bot integration configuration.'
      )
    }

    try {
      await axios.request({
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.segment.io/v1/identify',
        headers: {
          Authorization: `Bearer ${ctx.configuration.writeKey}`,
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          userId: '1',
          traits: {
            ignore: true,
            name: 'Test User',
          },
        }),
      })
    } catch (error) {
      throw new bpclient.RuntimeError(
        'Configuration Error! The Segment write key is not set. Please set it in your bot integration configuration.'
      )
    }
  },
  unregister: async () => {},
  actions: {
    updateUserProfile: async (args): Promise<updateUserProfileOutput> => {
      args.logger.forBot().info('Updating User Profile', args.input)

      const analytics = new Analytics(args.ctx.configuration.writeKey)
      let traits = {}

      // Safely attempting to parse userProfile
      try {
        if (args.input.userProfile) {
          traits = JSON.parse(args.input.userProfile)
        }
      } catch (error) {
        args.logger.forBot().error('Invalid JSON as userProfile. Must be JSON.stringable()')
        return {
          success: false,
          log: 'Invalid JSON as userProfile. Must be JSON.stringable()',
        }
      }

      try {
        await new Promise((resolve, reject) => {
          analytics.identify({ userId: args.input.userId, traits: traits }, (err) => {
            if (err) {
              args.logger.forBot().error('Failed to update user profile in Segment', err)
              reject(err)
            } else {
              resolve({})
            }
          })
        })
      } catch (error) {
        args.logger.forBot().error('Error during Segment identify operation', error)
        return {
          success: false,
          log: 'Error during Segment identify operation',
        }
      }

      return { success: true, log: 'User profile updated successfully' }
    },
    trackNode: async (args): Promise<trackNodeOutput> => {
      args.logger.forBot().info('Tracking node view:', args.input)

      const analytics = new Analytics(args.ctx.configuration.writeKey)

      try {
        await new Promise((resolve, reject) => {
          analytics.page(
            {
              category: 'page',
              userId: args.input.userId,
              name: args.input.nodeId,
            },
            (err) => {
              if (err) {
                args.logger.forBot().error('Failed to track node in Segment', err)
                reject(err)
              } else {
                resolve({})
              }
            }
          )
        })
      } catch (error) {
        args.logger.forBot().error('Error during Segment page operation', error)
        return { success: false, log: 'Error during Segment page operation' }
      }

      return { success: true, log: 'Node tracked successfully' }
    },
    trackEvent: async (args): Promise<trackEventOutput> => {
      args.logger.forBot().info('Tracking data for event:', args.input.eventName)

      const analytics = new Analytics(args.ctx.configuration.writeKey)
      let eventPayload = {}

      try {
        if (args.input.eventPayload) {
          eventPayload = JSON.parse(args.input.eventPayload)
        }
      } catch (error) {
        args.logger.forBot().error('Invalid JSON as eventPayload. Must be JSON stringifiable', error)
        return {
          success: false,
          log: 'Invalid JSON as eventPayload. Must be JSON stringifiable',
        }
      }

      try {
        await new Promise((resolve, reject) => {
          analytics.track(
            {
              event: args.input.eventName,
              userId: args.input.userId,
              properties: eventPayload,
            },
            (err) => {
              if (err) {
                args.logger.forBot().error('Failed to track event in Segment', err)
                reject(err)
              } else {
                resolve({})
              }
            }
          )
        })
      } catch (error) {
        args.logger.forBot().error('Error during Segment track operation', error)
        return { success: false, log: 'Error during Segment track operation' }
      }

      return { success: true, log: 'Event tracked successfully' }
    },
  },
  channels: {},
  handler: async () => {},
})

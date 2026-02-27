import * as botpress from '.botpress'
import axios from 'axios'
import Mixpanel from 'mixpanel'
import * as bpclient from '@botpress/client'

export default new botpress.Integration({
  register: async ({ ctx }) => {
    if (!ctx.configuration.token) {
      throw new bpclient.RuntimeError(
        'Configuration Error! The Mixpanel token is not set. Please set it in your bot integration configuration.'
      )
    }
    const token = ctx.configuration.token

    try {
      // basic auth, username is token, password is empty
      await axios.post(
        'https://api.mixpanel.com/import',
        {
          // bad payload on purpose, we don't want to track anything
        },
        {
          auth: {
            username: token,
            password: '',
          },
        }
      )
    } catch (error: any) {
      // if the error isn't an axios error, throw it
      if (!error.response) {
        throw new bpclient.RuntimeError('Configuration Error! Unknown error.')
      }

      // if error code is 401, it means the token is incorrect
      if (error.response.status === 401) {
        throw new bpclient.RuntimeError('Configuration Error! The Mixpanel token is incorrect.')
      }
      // otherwise we are good!
    }
  },
  unregister: async () => {},
  actions: {
    updateUserProfile: async (args) => {
      args.logger.forBot().info('Updating User Profile', args.input.userProfile)

      let traits = {}

      try {
        if (args.input.userProfile) {
          traits = JSON.parse(args.input.userProfile)
        }
      } catch (error) {
        args.logger.forBot().error('Invalid JSON as userProfile. Must be JSON.stringable()')
        return { success: false, log: 'Invalid JSON as userProfile. Must be JSON.stringable()' }
      }

      const options = {
        method: 'POST',
        url: 'https://api.mixpanel.com/engage#profile-set',
        headers: { accept: 'text/plain', 'content-type': 'application/json' },
        data: [
          {
            $token: args.ctx.configuration.token,
            $distinct_id: args.input.userId,
            $set: traits,
          },
        ],
      }

      await axios
        .request(options)
        .then(function (response) {
          args.logger.forBot().info(response.data)
        })
        .catch(function (error) {
          args.logger.forBot().error(error)
          return {}
        })

      return { success: true, log: 'User profile updated successfully' }
    },
    trackEvent: async (args) => {
      args.logger.forBot().info('Tracking data for event:', args.input.eventName)

      const mixpanel = Mixpanel.init(args.ctx.configuration.token)

      let eventPayload = {}

      try {
        if (args.input.eventPayload) {
          eventPayload = JSON.parse(args.input.eventPayload)
        }
      } catch (error) {
        args.logger.forBot().error('Invalid JSON as eventPayload. Must be a JSON string', error)
        return {}
      }

      try {
        await new Promise((resolve, reject) => {
          mixpanel.track(
            args.input.eventName,
            {
              distinct_id: args.input.userId,
              ...eventPayload,
            },
            (err) => {
              if (err) {
                args.logger.forBot().error('Failed to track event in Mixpanel', err)
                reject(err)
              } else {
                resolve({})
              }
            }
          )
        })
      } catch (error) {
        args.logger.forBot().error('Error during Mixpanel track operation', error)
        return {}
      }

      return {}
    },
  },
  channels: {},
  handler: async () => {},
})

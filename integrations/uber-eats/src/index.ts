import * as sdk from '@botpress/sdk'
import { actions } from './actions'
import { UberEatsClient } from './api/uber-client'
import { handler } from './handler'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx, client, logger }) => {
    const uber = new UberEatsClient({
      clientId: ctx.configuration.clientId,
      clientSecret: ctx.configuration.clientSecret,
      bpClient: client,
      ctx,
    })
    try {
      await uber.testConnection()
    } catch (error) {
      throw new sdk.RuntimeError('Uber Eats integration setup failed. Check provided credentials')
    }

    logger.forBot().info('Uber Eats credentials validated.')
  },

  unregister: async () => {},
  actions,
  channels: {},
  handler,
})

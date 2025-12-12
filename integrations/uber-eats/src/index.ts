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

    await uber.testConnection()

    logger.forBot().info('Uber Eats credentials validated.')
  },

  unregister: async () => {},
  actions,
  channels: {},
  handler,
})

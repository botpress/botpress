import * as sdk from '@botpress/sdk'
import { actions } from 'src/actions'
import { UberEatsClient } from 'src/api'
import { handler } from 'src/handler'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx, client, logger }) => {
    const uber = new UberEatsClient({
      clientId: ctx.configuration.clientId,
      clientSecret: ctx.configuration.clientSecret,
      bpClient: client,
      ctx,
      logger,
    })
    try {
      await uber.testConnection()
    } catch {
      throw new sdk.RuntimeError('Uber Eats integration setup failed. Check provided credentials')
    }

    logger.forBot().info('Uber Eats credentials validated.')
  },

  unregister: async () => {},
  actions,
  channels: {},
  handler,
})

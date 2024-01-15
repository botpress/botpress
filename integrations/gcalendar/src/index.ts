import * as actions from './actions'
import { getClient } from './client'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ logger, ctx }) => {
    logger.forBot().info('Registering Google Calendar integration')
    try {
      const { auth } = await getClient(ctx.configuration)
      await auth.authorize()

      logger.forBot().info('Successfully connected and authenticated with Google Calendar')
    } catch (err) {
      logger.forBot().error('Failed to connect to Google Calendar', err)
      return
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})

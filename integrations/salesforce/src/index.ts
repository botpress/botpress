import { actions } from './actions'
import { handler } from './handler'
import { getSfCredentials } from './misc/utils/bp-utils'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    const { client, ctx, logger } = props

    const credentials = await getSfCredentials(client, ctx.integrationId)

    if ((ctx.configurationType === 'sfsandbox') !== credentials.isSandbox) {
      await client.setState({
        type: 'integration',
        name: 'credentials',
        id: ctx.integrationId,
        payload: null,
      })

      logger.forBot().info('Salesforce environment has changed, please login again')
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler,
})

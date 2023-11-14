import actions from './actions'
import * as bp from '.botpress'
import { getClient } from './client'

export default new bp.Integration({
  register: async (props) => {
    props.logger.forBot().info('Registering Gsheets integration')
    try {
      const gsheetsClient = getClient(props.ctx.configuration)
      const { properties, sheets } = await gsheetsClient.getSpreadsheet('')
      const summary = JSON.stringify({ properties, sheets }).substring(0, 200)
      props.logger.forBot().info(`Successfully connected to Gsheets`)
    } catch (thrown) {
      props.logger.forBot().error(`Failed to connect to Gsheets: ${thrown}`)
      throw thrown
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})

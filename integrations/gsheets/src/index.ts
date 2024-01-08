import actions from './actions'
import { getClient } from './client'
import { summarizeSpreadsheet } from './misc/utils'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    props.logger.forBot().info('Registering Google Sheets integration')
    try {
      const gsheetsClient = getClient(props.ctx.configuration)
      const spreadsheet = await gsheetsClient.getSpreadsheet('')
      const summary = summarizeSpreadsheet(spreadsheet)
      props.logger.forBot().info(`Successfully connected to Google Sheets: ${summary}`)
    } catch (thrown) {
      props.logger.forBot().error(`Failed to connect to Google Sheets: ${thrown}`)
      throw thrown
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})

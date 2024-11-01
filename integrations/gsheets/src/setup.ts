import { getClient } from './google-api/client'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ logger, ctx }) => {
  logger.forBot().info('Registering Google Sheets integration')
  try {
    const gsheetsClient = getClient(ctx.configuration)
    const summary = await gsheetsClient.getSpreadsheetSummary()
    logger.forBot().info(`Successfully connected to Google Sheets: ${summary}`)
  } catch (thrown) {
    logger.forBot().error(`Failed to connect to Google Sheets: ${thrown}`)
    throw thrown
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

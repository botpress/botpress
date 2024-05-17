import { getClient } from '../client'
import type { IntegrationProps } from '../misc/types'
import * as bp from '.botpress'

export const getInfoSpreadsheet: IntegrationProps['actions']['getInfoSpreadsheet'] = async ({ ctx, input, logger }) => {
  logger.forBot().debug('Calling action "getInfoSpreadsheet" with input: ', input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response: bp.actions.getInfoSpreadsheet.output.Output

  try {
    response = await GoogleSheetsClient.getSpreadsheet(input.fields.join(','))
    logger.forBot().info(`Successful - Get Spreadsheet - ${response?.spreadsheetId}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Get Spreadsheet' exception ${error}`)
  }

  return response
}

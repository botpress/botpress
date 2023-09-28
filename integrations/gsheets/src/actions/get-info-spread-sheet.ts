import { getInfoSpreadsheetInputSchema } from 'src/misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient } from '../utils'

export const getInfoSpreadsheet: Implementation['actions']['getInfoSpreadsheet'] =
  async ({ ctx, input, logger }) => {
    const validatedInput = getInfoSpreadsheetInputSchema.parse(input)
    const GoogleSheetsClient = getClient(ctx.configuration)
    let response

    try {
      response = await GoogleSheetsClient.getSpreadsheet(validatedInput.fields)
      logger
        .forBot()
        .info(`Successful - Get Spreadsheet - ${response?.spreadsheetId}`)
    } catch (error) {
      response = {}
      logger.forBot().debug(`'Get Spreadsheet' exception ${error}`)
    }

    return { spreadsheetId: response?.spreadsheetId || '' }
  }

import { GoogleClient } from './google-api/google-client'
import { getAllowedSpreadsheetIds } from './google-api/spreadsheet-selection'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ logger, ctx, client }) => {
  logger.forBot().info('Registering Google Sheets integration')

  const allowedSpreadsheetIds = await getAllowedSpreadsheetIds({ ctx, client })

  // Connection check against the default spreadsheet only: the others are reached
  // with the same credentials, and failing registration over one unreachable
  // sheet would block the whole installation.
  const gsheetsClient = await GoogleClient.create({ ctx, client })
  const summary = await gsheetsClient.getSpreadsheetSummary()

  const others = allowedSpreadsheetIds.length - 1
  logger
    .forBot()
    .info(
      `Successfully connected to Google Sheets: default ${summary}` +
        (others > 0 ? ` (+ ${others} other spreadsheet${others > 1 ? 's' : ''} selected)` : '')
    )
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

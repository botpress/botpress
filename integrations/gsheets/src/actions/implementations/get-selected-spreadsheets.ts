import { getAllowedSpreadsheetIds } from '../../google-api/spreadsheet-selection'
import { wrapAction } from '../action-wrapper'

export const getSelectedSpreadsheets = wrapAction(
  { actionName: 'getSelectedSpreadsheets', errorMessageWhenFailed: 'Failed to obtain the selected spreadsheets' },
  async ({ googleClient, ctx, client }) => {
    const spreadsheetIds = await getAllowedSpreadsheetIds({ ctx, client })
    const titles = await googleClient.getSpreadsheetTitles(spreadsheetIds)

    return {
      spreadsheets: spreadsheetIds.map((spreadsheetId, index) => ({
        spreadsheetId,
        title: titles[spreadsheetId],
        isDefault: index === 0,
      })),
    }
  }
)

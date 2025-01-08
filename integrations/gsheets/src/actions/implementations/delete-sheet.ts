import { wrapAction } from '../action-wrapper'

export const deleteSheet = wrapAction(
  { actionName: 'deleteSheet', errorMessageWhenFailed: 'Failed to delete sheet from spreadsheet' },
  async ({ googleClient }, { sheetId }) => await googleClient.deleteSheetFromSpreadsheet({ sheetId })
)

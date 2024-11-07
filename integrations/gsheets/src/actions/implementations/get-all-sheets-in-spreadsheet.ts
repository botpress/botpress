import { wrapAction } from '../action-wrapper'

export const getAllSheetsInSpreadsheet = wrapAction(
  { actionName: 'getAllSheetsInSpreadsheet', errorMessageWhenFailed: 'Failed to obtain sheets' },
  async ({ googleClient }) => ({
    sheets: await googleClient.getAllSheetsInSpreadsheet(),
  })
)

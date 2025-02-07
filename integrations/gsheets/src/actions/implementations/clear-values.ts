import { wrapAction } from '../action-wrapper'

export const clearValues = wrapAction(
  { actionName: 'clearValues', errorMessageWhenFailed: 'Failed to clear values from the spreadsheet' },
  async ({ googleClient }, { range: rangeA1 }) => await googleClient.clearValuesFromSpreadsheetRange({ rangeA1 })
)

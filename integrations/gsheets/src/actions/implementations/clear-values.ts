import { wrapAction } from '../action-wrapper'

export const clearValues = wrapAction(
  { actionName: 'clearValues', errorMessageWhenFailed: 'Failed to clear values from the spreadsheet' },
  async ({ input, googleClient }) =>
    await googleClient.clearValuesFromSpreadsheetRange({ rangeA1: input.range, majorDimension: input.majorDimension })
)

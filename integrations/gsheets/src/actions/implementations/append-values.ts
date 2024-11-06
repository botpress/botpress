import { wrapAction } from '../action-wrapper'

export const appendValues = wrapAction(
  { actionName: 'appendValues', errorMessageWhenFailed: 'Failed to append values into spreadsheet' },
  async ({ googleClient }, { range: rangeA1, values, majorDimension }) =>
    await googleClient.appendValuesToSpreadsheetRange({
      rangeA1,
      values,
      majorDimension,
    })
)

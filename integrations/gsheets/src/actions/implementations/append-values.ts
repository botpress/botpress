import { wrapAction } from '../action-wrapper'

export const appendValues = wrapAction(
  { actionName: 'appendValues', errorMessageWhenFailed: 'Failed to append values into spreadsheet' },
  async ({ input, googleClient }) =>
    await googleClient.appendValuesToSpreadsheetRange({
      rangeA1: input.range,
      values: input.values,
      majorDimension: input.majorDimension,
    })
)

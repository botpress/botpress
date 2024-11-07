import { wrapAction } from '../action-wrapper'

export const getValues = wrapAction(
  { actionName: 'getValues', errorMessageWhenFailed: 'Failed to get values from the specified range' },
  async ({ googleClient }, { range: rangeA1, majorDimension }) =>
    await googleClient.getValuesFromSpreadsheetRange({
      rangeA1,
      majorDimension,
    })
)

import { wrapAction } from '../action-wrapper'

export const updateValues = wrapAction(
  { actionName: 'updateValues', errorMessageWhenFailed: 'Failed to update values in the specified range' },
  async ({ googleClient }, { range: rangeA1, majorDimension, values }) =>
    await googleClient.updateValuesInSpreadsheetRange({
      rangeA1,
      majorDimension,
      values,
    })
)

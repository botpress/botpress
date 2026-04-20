import { wrapAction } from '../action-wrapper'

export const setValues = wrapAction(
  { actionName: 'setValues', errorMessageWhenFailed: 'Failed to set values in the specified range' },
  async ({ googleClient }, { range: rangeA1, majorDimension, values }) =>
    await googleClient.updateValuesInSpreadsheetRange({
      rangeA1,
      majorDimension,
      values,
    })
)

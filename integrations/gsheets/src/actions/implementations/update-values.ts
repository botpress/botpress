import { wrapAction } from '../action-wrapper'

export const updateValues = wrapAction(
  { actionName: 'updateValues', errorMessageWhenFailed: 'Failed to update values in the specified range' },
  async ({ input, googleClient }) =>
    await googleClient.updateValuesInSpreadsheetRange({
      rangeA1: input.range,
      majorDimension: input.majorDimension,
      values: input.values,
    })
)

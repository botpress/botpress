import { wrapAction } from '../action-wrapper'

export const updateValues = wrapAction(
  { actionName: 'updateValues', errorMessageWhenFailed: 'Failed to update values in the specified range' },
  async ({ input, gsheetsClient }) => await gsheetsClient.updateValues(input.range, input.values, input.majorDimension)
)

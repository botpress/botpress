import { wrapAction } from '../action-wrapper'

export const appendValues = wrapAction(
  { actionName: 'appendValues', errorMessageWhenFailed: 'Failed to append values into spreadsheet' },
  async ({ input, gsheetsClient }) => await gsheetsClient.appendValues(input.range, input.values, input.majorDimension)
)

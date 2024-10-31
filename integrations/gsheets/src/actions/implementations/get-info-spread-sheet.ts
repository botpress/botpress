import { wrapAction } from '../action-wrapper'

export const getInfoSpreadsheet = wrapAction(
  { actionName: 'getInfoSpreadsheet', errorMessageWhenFailed: 'Failed to get spreadsheet info' },
  async ({ input, gsheetsClient }) => await gsheetsClient.getSpreadsheet(input.fields.join(','))
)

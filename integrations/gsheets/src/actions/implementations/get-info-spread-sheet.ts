import { wrapAction } from '../action-wrapper'

export const getInfoSpreadsheet = wrapAction(
  { actionName: 'getInfoSpreadsheet', errorMessageWhenFailed: 'Failed to get spreadsheet info' },
  async ({ input, googleClient }) => await googleClient.getSpreadsheetMetadata({ fields: input.fields.join(',') })
)

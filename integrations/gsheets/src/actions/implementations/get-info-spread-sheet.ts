import { wrapAction } from '../action-wrapper'

export const getInfoSpreadsheet = wrapAction(
  { actionName: 'getInfoSpreadsheet', errorMessageWhenFailed: 'Failed to get spreadsheet info' },
  async ({ googleClient }, { fields }) => await googleClient.getSpreadsheetMetadata({ fields: fields.join(',') })
)

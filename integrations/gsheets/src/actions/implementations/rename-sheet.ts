import { wrapAction } from '../action-wrapper'

export const renameSheet = wrapAction(
  { actionName: 'renameSheet', errorMessageWhenFailed: 'Failed to rename sheet' },
  async ({ googleClient }, { sheetId, newTitle }) => await googleClient.renameSheetInSpreadsheet({ sheetId, newTitle })
)

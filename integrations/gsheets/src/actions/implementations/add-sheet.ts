import { wrapAction } from '../action-wrapper'

export const addSheet = wrapAction(
  { actionName: 'addSheet', errorMessageWhenFailed: 'Failed to add new sheet' },
  async ({ googleClient }, { title: sheetTitle }) => await googleClient.createNewSheetInSpreadsheet({ sheetTitle })
)

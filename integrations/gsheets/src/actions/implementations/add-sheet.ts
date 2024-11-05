import { wrapAction } from '../action-wrapper'

export const addSheet = wrapAction(
  { actionName: 'addSheet', errorMessageWhenFailed: 'Failed to add new sheet' },
  async ({ input, googleClient }) => await googleClient.createNewSheetInSpreadsheet({ sheetTitle: input.title })
)

import { wrapAction } from '../action-wrapper'

export const duplicateSheet = wrapAction(
  { actionName: 'duplicateSheet', errorMessageWhenFailed: 'Failed to duplicate sheet' },
  async ({ googleClient }, { sourceSheetName, newSheetName, insertSheetIndex }) =>
    await googleClient.duplicateSheetInSpreadsheet({ sourceSheetName, newSheetName, insertSheetIndex })
)

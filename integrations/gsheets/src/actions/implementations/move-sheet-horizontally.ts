import { wrapAction } from '../action-wrapper'

export const moveSheetHorizontally = wrapAction(
  { actionName: 'moveSheetHorizontally', errorMessageWhenFailed: 'Failed to move sheet to the new index' },
  async ({ googleClient }, { sheetId, newIndex }) => await googleClient.moveSheetToIndex({ sheetId, newIndex })
)

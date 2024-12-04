import { wrapAction } from '../action-wrapper'

export const setSheetVisibility = wrapAction(
  { actionName: 'setSheetVisibility', errorMessageWhenFailed: 'Failed to set sheet visibility' },
  async ({ googleClient }, { sheetId, isHidden }) => await googleClient.setSheetVisibility({ sheetId, isHidden })
)

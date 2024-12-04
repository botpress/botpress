import { wrapAction } from '../action-wrapper'

export const createNamedRangeInSheet = wrapAction(
  { actionName: 'createNamedRangeInSheet', errorMessageWhenFailed: 'Failed to add named range to sheet' },
  async ({ googleClient }, { rangeName, rangeA1, sheetId }) =>
    await googleClient.createNamedRangeInSheet({ a1Notation: rangeA1, rangeName, sheetId })
)

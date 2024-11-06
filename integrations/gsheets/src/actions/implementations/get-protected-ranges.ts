import { wrapAction } from '../action-wrapper'

export const getProtectedRanges = wrapAction(
  {
    actionName: 'getProtectedRanges',
    errorMessageWhenFailed: 'Failed to obtain the protected ranges of the spreadsheet',
  },
  async ({ googleClient }) => ({
    protectedRanges: await googleClient.getProtectedRanges(),
  })
)

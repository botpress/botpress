import { wrapAction } from '../action-wrapper'

export const getNamedRanges = wrapAction(
  { actionName: 'getNamedRanges', errorMessageWhenFailed: 'Failed to obtain the named ranges of the spreadsheet' },
  async ({ googleClient }) => ({
    namedRanges: await googleClient.getNamedRanges(),
  })
)

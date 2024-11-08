import { wrapAction } from '../action-wrapper'

export const unprotectRange = wrapAction(
  { actionName: 'unprotectRange', errorMessageWhenFailed: 'Failed to delete protected range' },
  async ({ googleClient }, { protectedRangeId }) => await googleClient.unprotectRange({ protectedRangeId })
)

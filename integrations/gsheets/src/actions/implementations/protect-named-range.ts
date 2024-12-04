import { wrapAction } from '../action-wrapper'

export const protectNamedRange = wrapAction(
  { actionName: 'protectNamedRange', errorMessageWhenFailed: 'Failed to protect the named range' },
  async ({ googleClient }, { namedRangeId, requestingUserCanEdit, warningOnly }) =>
    await googleClient.protectNamedRange({ namedRangeId, requestingUserCanEdit, warningOnly })
)

import { checkRule } from 'common/auth'

import { PermissionAllowedProps } from './typings'

export const isOperationAllowed = (params: PermissionAllowedProps) => {
  const profile = params.user
  if (!profile) {
    return false
  }

  if (profile.isSuperAdmin) {
    return true
  }

  if (params.superAdmin) {
    return false
  }

  if (!params.operation || !params.resource) {
    return true
  }

  if (profile.permissions && !checkRule(profile.permissions, params.operation, params.resource)) {
    return false
  }

  return true
}

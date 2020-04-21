import { checkRule } from 'common/auth'
import { UserProfile } from 'common/typings'

export interface RequiredPermission {
  /** The resource to check permissions. Ex: module.qna */
  resource?: string
  /** The operation to check */
  operation?: 'read' | 'write'
  /** Should the user be a super admin to see this? */
  superAdmin?: boolean
}

export type PermissionAllowedProps = {
  user?: Pick<UserProfile, 'isSuperAdmin' | 'permissions'>
} & RequiredPermission

export type AccessControlProps = {
  /** Component to display if user has the right access */
  readonly children: React.ReactNode
  /** Optionally set a fallback component if no access */
  readonly fallback?: React.ReactNode
} & PermissionAllowedProps

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

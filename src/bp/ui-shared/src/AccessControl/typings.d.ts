import { UserProfile } from 'common/typings'

export interface RequiredPermission {
  /** The resource to check permissions. Ex: module.qna */
  resource?: string
  /** The operation to check */
  operation?: PermissionOperation
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

export type PermissionOperation = 'read' | 'write'

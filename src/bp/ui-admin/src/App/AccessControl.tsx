import { checkRule } from 'common/auth'
import { useEffect } from 'react'
import { connect } from 'react-redux'
import store from '~/store'

import { fetchPermissions } from '../reducers/user'

export interface PermissionAllowedProps {
  /** The resource to check permissions. Ex: module.qna */
  resource: string
  /** The operation to check */
  operation: 'read' | 'write'
  /** Should the user be a super admin to see this? */
  superAdmin?: boolean
}

export type PermissionsCheckerProps = {
  /** Component to display if user has the right access */
  readonly children: React.ReactNode
  /** Optionally set a fallback component if no access */
  readonly fallback?: React.ReactNode
} & PermissionAllowedProps

export const isOperationAllowed = (params: PermissionAllowedProps) => {
  const profile = store.getState().user.profile
  if (profile && profile.isSuperAdmin) {
    return true
  }

  // If the user is a super admin, then he shouldn't reach this validation
  if (params.superAdmin) {
    return false
  }

  const permissions = store.getState().user.permissions
  if (permissions && !checkRule(permissions, params.operation, params.resource)) {
    return false
  }

  return true
}

export const isChatUser = (): boolean => {
  const permissions = store.getState().user.permissions
  return permissions && !!permissions.find(p => p.res.startsWith('chatuser'))
}
// TODO: Add typings once every other AccessControl is updated PermissionsCheckerProps

const PermissionsChecker = props => {
  const { resource, operation, superAdmin, children, fallback = null } = props
  return isOperationAllowed({ resource, operation, superAdmin }) ? children : (fallback as any)
}

const mapStateToProps = state => ({ permissions: state.user.permissions, test: state.user })

export const AccessControl = connect(
  mapStateToProps,
  { fetchPermissions }
)(PermissionsChecker)

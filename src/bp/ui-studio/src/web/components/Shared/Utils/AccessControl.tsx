import { checkRule } from 'common/auth'
import React from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import store from '~/store'

import { AccessControlProps, PermissionAllowedProps } from './typings'

export const isOperationAllowed = (params: PermissionAllowedProps) => {
  if (!params.user) {
    params.user = (store.getState() as RootReducer).user
  }

  const { user, resource, operation } = params
  if (user.isSuperAdmin) {
    return true
  }

  // If the user is a super admin, then he shouldn't reach this validation
  if (params.superAdmin) {
    return false
  }

  // TODO: Refactor this on v12.1.4
  if (window.BOT_LOCKED && operation === 'write' && resource.startsWith('bot')) {
    return false
  }

  if (!user || (user.permissions && !checkRule(user.permissions, operation, resource))) {
    return false
  }

  return true
}

const PermissionsChecker = (props: AccessControlProps) => {
  const { user, resource, operation, superAdmin, children, fallback = null } = props
  return isOperationAllowed({ user, resource, operation, superAdmin }) ? children : fallback
}

const mapStateToProps = state => ({ user: state.user })

const ConnectedAccessControl = connect(mapStateToProps, undefined)(PermissionsChecker)

export default props => <ConnectedAccessControl {...props} store={store} />

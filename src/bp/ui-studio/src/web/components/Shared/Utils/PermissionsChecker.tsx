import { checkRule } from 'common/auth'
import React from 'react'
import { connect } from 'react-redux'
import store from '~/store'

import { PermissionsCheckerProps } from './typings'

export const operationAllowed = ({ user, res, op }) => {
  // TODO: Refactor this on v12.1.4
  if (window.BOT_LOCKED && op === 'write' && res.startsWith('bot')) {
    return false
  }
  if (!user) {
    return false
  }
  if (user.permissions && !checkRule(user.permissions, op, res)) {
    return false
  }
  return true
}

const PermissionsChecker = (props: PermissionsCheckerProps) => {
  const { user, resource, operation, children, fallback = null } = props
  return operationAllowed({ user, res: resource, op: operation }) ? children : fallback
}

const mapStateToProps = state => ({ user: state.user })

const ConnectedPermissionChecker = connect(
  mapStateToProps,
  undefined
)(PermissionsChecker)

export default props => <ConnectedPermissionChecker {...props} store={store} />

import { checkMultipleRoles } from '@botpress/util-roles'

export const operationAllowed = ({ user, res, op }) => {
  if (!user) {
    return false
  }
  if (user.roles && !checkMultipleRoles(user.roles, op, res)) {
    return false
  }
  return true
}

const PermissionsChecker = ({ user, res, op, children, fallback = null }) =>
  operationAllowed({ user, res, op }) ? children : fallback

export default PermissionsChecker

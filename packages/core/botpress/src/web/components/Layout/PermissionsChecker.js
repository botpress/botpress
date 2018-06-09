import { checkMultipleRoles } from '@botpress/util-roles'

const PermissionsChecker = ({ user, res, op, children }) => {
  if (!user) {
    return null
  }
  if (user.roles && !checkMultipleRoles(user.roles, op, res)) {
    return null
  }
  return children
}

export default PermissionsChecker

import { checkRule } from 'common/auth'

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

const PermissionsChecker = ({ user, res, op, children, fallback = null }) =>
  operationAllowed({ user, res, op }) ? children : fallback

export default PermissionsChecker

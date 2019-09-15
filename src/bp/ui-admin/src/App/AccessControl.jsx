import { checkRule } from 'common/auth'

export const AccessControl = props => {
  if (!props.operation || !props.resource || checkRule(props.permissions, props.operation, props.resource)) {
    return props.children
  }
  return null
}

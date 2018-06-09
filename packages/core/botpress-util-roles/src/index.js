export { RESOURCES, enrichResources } from './resources'

export const ressourceMatches = (pattern, res) => {
  const separator = /[\/\.]/
  pattern = pattern || ''

  if (!~pattern.indexOf('*')) {
    pattern = pattern += '.*'
  }

  const parts = pattern.split(separator)
  const testParts = res.split(separator)

  let matches = true
  for (let ii = 0; matches && ii < parts.length; ii++) {
    if (parts[ii] === '*') {
      continue
    } else if (ii < testParts.length) {
      matches = parts[ii].toLowerCase() === testParts[ii].toLowerCase()
    } else {
      matches = false
    }
  }

  return matches
}

const OPERATION_ALIASES = {
  read: 'r',
  write: 'w'
}

const KNOWN_OPERATIONS = ['r', 'w']

export const checkRule = (rules, operation, ressource) => {
  if (!rules) {
    return false
  }

  operation = operation.toLowerCase()
  operation = OPERATION_ALIASES[operation] || operation

  if (!KNOWN_OPERATIONS.includes(operation)) {
    throw new Error(`Invalid rule operation: ${operation}`)
  }

  let permission = false // Everything is restricted by default

  for (const rule of rules) {
    const { op } = rule
    if (!op || op.length < 2 || op.length > 4) {
      throw new Error(`Invalid rule operation: ${op}`)
    }

    if (!ressourceMatches(rule.res, ressource)) {
      continue
    }

    if (op.length === 4) {
      // `+r-w` form
      if (op[1] === operation) {
        permission = op[0] === '+'
      } else if (op[3] === operation) {
        permission = op[2] === '+'
      } else {
        permission = false
      }
    } else if (op.length === 3) {
      // `+rw` form
      permission = op[0] === '+'
    } else if (op.length === 2) {
      // `+r` form
      if (op[1] === operation) {
        permission = op[0] === '+'
      }
    } // else leave the permission untouched
  }

  return permission
}

export const checkMultipleRoles = (roles, operation, ressource) => {
  if (!roles) {
    return false
  }

  for (const roleName in roles) {
    if (checkRule(roles[roleName], operation, ressource)) {
      return true
    }
  }

  return false
}

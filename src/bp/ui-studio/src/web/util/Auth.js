import EventEmitter2 from 'eventemitter2'
import axios from 'axios'
import nanoid from 'nanoid'

const storageKey = 'bp/token'

export const authEvents = new EventEmitter2()

export const getToken = () => {
  const tokenStr = localStorage.getItem(storageKey)

  if (tokenStr) {
    return JSON.parse(tokenStr)
  }

  return false
}

export const setToken = token => {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      token,
      time: new Date()
    })
  )

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  authEvents.emit('new_token')
}

export const logout = () => {
  localStorage.removeItem(storageKey)
  authEvents.emit('logout')
}

export const login = (user, password) => {
  return axios.post('/api/login', { user, password }).then(result => {
    if (result.data.success) {
      setToken(result.data.token)
      authEvents.emit('login')
    } else {
      throw new Error(result.data.reason)
    }
  })
}

export const getUniqueVisitorId = () => {
  let userId = localStorage.getItem('bp/socket/user')

  if (!userId) {
    userId = nanoid()
    localStorage.setItem('bp/socket/user', userId)
  }

  window.__BP_VISITOR_ID = userId
  return userId
}

export const resourceMatches = (pattern, res) => {
  const separator = /[\/\.]/
  pattern = pattern || ''

  if (pattern.indexOf('*') < 0) {
    pattern = pattern + '.*'
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

export const checkRule = (rules, operation, resource) => {
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

    if (!resourceMatches(rule.res, resource)) {
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

export const checkMultipleRoles = (roles, operation, resource) => {
  if (!roles) {
    return false
  }

  for (const roleName in roles) {
    if (checkRule(roles[roleName], operation, resource)) {
      return true
    }
  }

  return false
}

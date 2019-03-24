const debug = require('debug')

const available = {}

export const Debug = (mod: string, base = 'bp') => {
  const namespace = base + ':' + mod
  available[namespace] = true
  const instance = debug(base).extend(mod)
  instance.sub = mod => Debug(mod, namespace)
  instance.forBot = (botId, message, extra?) => {
    return extra ? instance(`(${botId}) ${message}`, extra) : instance(`(${botId}) ${message}`)
  }
  return instance
}

export const getDebugScopes = () => {
  const status = {}
  Object.keys(available).forEach(key => (status[key] = debug.enabled(key)))
  return status
}

export const setDebugScopes = scopes => {
  debug.disable()
  debug.enable(scopes)
}

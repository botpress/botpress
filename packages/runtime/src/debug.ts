const debug = require('debug')

const available = {}

export const Debug = (mod: string, base = 'bp') => {
  const namespace = base + ':' + mod
  available[namespace] = true
  const instance = debug(base).extend(mod)
  instance.sub = mod => Debug(mod, namespace)
  instance.forBot = (botId: string, message: string, extra?: any) => {
    if (extra) {
      return instance(`(${botId}) ${message}`, extra, { botId })
    } else {
      return instance(`(${botId}) ${message}`, { botId })
    }
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

  scopes.split(',').forEach(key => (available[key] = debug.enabled(key)))

  if (process.send) {
    const { MessageType } = require('orchestrator')
    process.send({ type: MessageType.UpdateDebugScopes, scopes })
  }
}

debug.log = function(...args) {
  const botId = (args[0] && args[0].botId) || (args[1] && args[1].botId) || (args[2] && args[2].botId)
  if (botId) {
    global.printBotLog(botId, args)
  } else {
    global.printLog(args)
  }
}

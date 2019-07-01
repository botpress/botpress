const debug = require('debug')

const available = {}

export const Debug = (mod: string, base = 'bp') => {
  const namespace = base + ':' + mod
  available[namespace] = true
  const instance = debug(base).extend(mod)
  instance.sub = mod => Debug(mod, namespace)
  instance.forBot = (botId, message, extra?) => {
    /**
     * The extra bot ID is required, because when you format logs using %o, the arguments are merged in the message & set undefined
     * %o pretty-prints an object on a single line which makes resulting logs more compact
     */
    if (extra) {
      const args = typeof extra === 'string' ? { extra, botId } : { ...extra, botId }
      return instance(`(${botId}) ${message}`, args, message.includes('%o') && { botId })
    } else {
      return instance(`(${botId}) ${message}`, { botId }, message.includes('%o') && { botId })
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
}

debug.log = function(...args) {
  const botId = (args[0] && args[0].botId) || (args[1] && args[1].botId) || (args[2] && args[2].botId)
  if (botId) {
    global.printBotLog(botId, args)
  } else {
    console.log.call(console, ...args)
  }
}

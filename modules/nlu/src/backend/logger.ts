import * as sdk from 'botpress/sdk'

export function makeLoggerWrapper(bp: typeof sdk, botId?: string): sdk.NLU.Logger {
  return <sdk.NLU.Logger>{
    info: (msg: string) => {
      const logger = _makeLogger(bp, botId)
      const formatedMsg = _makeMsg(msg, botId)
      logger.info(formatedMsg)
    },
    warning: (msg: string, err?: Error) => {
      const logger = _makeLogger(bp, botId)
      const formatedMsg = _makeMsg(msg, botId)
      err ? logger.attachError(err).warn(formatedMsg) : logger.warn(formatedMsg)
    },
    error: (msg: string, err?: Error) => {
      const logger = _makeLogger(bp, botId)
      const formatedMsg = _makeMsg(msg, botId)
      err ? logger.attachError(err).error(formatedMsg) : logger.error(formatedMsg)
    }
  }
}

function _makeLogger(bp: typeof sdk, botId: string) {
  return botId ? bp.logger.forBot(botId) : bp.logger
}

function _makeMsg(msg: string, botId: string | undefined) {
  return botId?.length ? `[${botId}] ${msg}` : msg
}

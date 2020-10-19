import * as sdk from 'botpress/sdk'

export default function(logger: sdk.Logger): sdk.NLU.Logger {
  return {
    info: (msg: string) => logger.info(msg),
    warning: (msg: string, err?: Error) => (err ? logger.attachError(err).warn(msg) : logger.warn(msg)),
    error: (msg: string, err?: Error) => (err ? logger.attachError(err).error(msg) : logger.error(msg))
  }
}

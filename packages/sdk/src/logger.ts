/* eslint-disable no-console */
import util from 'util'

const serializeForBotMessage = (args: Parameters<typeof util.format>) => {
  if (process.env['BP_LOGGER_FORMAT'] === 'json') {
    return JSON.stringify({ msg: util.format(...args), availableToBotOwner: true })
  } else {
    const [format, ...param] = args
    return util.format(`[For Bot Builder] ${format}`, ...param)
  }
}

export const logger = {
  /**
   * Use this function to log messages that will be displayed to the Bot Builder.
   */
  forBot: () => {
    return {
      log: (...args: Parameters<typeof console.log>) => {
        console.log(serializeForBotMessage(args))
      },
      info: (...args: Parameters<typeof console.info>) => {
        console.info(serializeForBotMessage(args))
      },
      warn: (...args: Parameters<typeof console.warn>) => {
        console.warn(serializeForBotMessage(args))
      },
      error: (...args: Parameters<typeof console.error>) => {
        console.error(serializeForBotMessage(args))
      },
      debug: (...args: Parameters<typeof console.debug>) => {
        console.debug(serializeForBotMessage(args))
      },
    }
  },
}

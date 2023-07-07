/* eslint-disable no-console */
import util from 'util'

const serializeForBotMessage = (args: Parameters<typeof util.format>) => {
  if (process.env['BP_LOG_FORMAT'] === 'json') {
    return JSON.stringify({ msg: util.format(...args), visible_to_bot_owner: true })
  } else {
    const [format, ...param] = args
    return util.format(`[For Bot Owner] ${format}`, ...param)
  }
}

export const integrationLogger = {
  /**
   * Use this function to log messages that will be displayed to the Bot Owner.
   */
  forBot: () => {
    return {
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

export type IntegrationLogger = typeof integrationLogger

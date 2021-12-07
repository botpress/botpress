import { BotConfig } from 'botpress/runtime-sdk'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { RuntimeConfig } from '../../config'

export interface DialogExpiry {
  context: Date
  session: Date
}

/**
 * Create expiry dates for dialog session and dialog context based on the bot configuration.
 * If no configuration is found for the bot, it will fallback to botpress config.
 *
 * @param botConfig The bot configuration file i.e. bot.config.json
 * @param runtimeConfig Botpress configuration file i.e. botpress.config.json
 */
export function createExpiry(botConfig: BotConfig, runtimeConfig: RuntimeConfig): DialogExpiry {
  const contextTimeout = ms(_.get(botConfig, 'dialog.timeoutInterval', runtimeConfig.dialog.timeoutInterval))
  const sessionTimeout = ms(
    _.get(botConfig, 'dialog.sessionTimeoutInterval', runtimeConfig.dialog.sessionTimeoutInterval)
  )

  return {
    context: moment()
      .add(contextTimeout, 'ms')
      .toDate(),
    session: moment()
      .add(sessionTimeout, 'ms')
      .toDate()
  }
}

import { BotConfig } from 'botpress/sdk'
import { BotpressConfig } from 'core/config'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

export interface DialogExpiry {
  context: Date
  session: Date
}

/**
 * Create expiry dates for dialog session and dialog context based on the bot configuration.
 * If no configuration is found for the bot, it will fallback to botpress config.
 *
 * @param botConfig The bot configuration file i.e. bot.config.json
 * @param botpressConfig Botpress configuration file i.e. botpress.config.json
 */
export function createExpiry(botConfig: BotConfig, botpressConfig: BotpressConfig): DialogExpiry {
  const contextTimeout = ms(_.get(botConfig, 'dialog.timeoutInterval', botpressConfig.dialog.timeoutInterval))
  const sessionTimeout = ms(
    _.get(botConfig, 'dialog.sessionTimeoutInterval', botpressConfig.dialog.sessionTimeoutInterval)
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

export interface Config {
  /**
   * The bot token received from the Telegram Botfather
   * @default your_bot_token
   */
  botToken: string
  /**
   * Enable or disable this channel for this bot
   * @default false
   */
  enabled: boolean
  /**
   * Force usage of webhooks
   * @default false
   */
  forceWebhook: boolean
  /**
   * The duration of the authentication session when a user authenticate through this channel.
   * @default 24h
   */
  chatUserAuthDuration: string
}

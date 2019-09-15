export interface Config {
  /** The bot token received from the Telegram Botfather */
  botToken: string

  /** Enable or disable this channel for this bot */
  enabled: boolean

  /** Force usage of webhooks */
  forceWebhook: boolean
}

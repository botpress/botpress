export interface Config {
  /**
   * If the channel is enabled for the bot (this config file must be in the data/bots/BOT_ID/config folder)
   * @default false
   */
  enabled: boolean
  /**
   * The microsoft appId for this bot
   * @default your_app_id
   */
  appId: string

  /**
   * The microsoft app Password (secret) to use for this bot
   * @default your_app_password
   */
  appPassword: string

  /**
   * The tenant ID (if supported account type is a specific organization)
   */
  tenantId?: string
}

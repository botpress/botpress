export interface Config {
  /** The microsoft appId for this bot */
  microsoftAppId: string

  /** The microsoft app Password (secret) to use for this bot */
  microsoftAppPassword: string

  /** Enable or disable this channel for this bot */
  enabled: boolean

  // /** Force usage of webhooks */
  // forceWebhook: boolean
}

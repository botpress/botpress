export interface Config {
  /**
   * If the channel is enabled for the bot (this config file must be in the data/bots/BOT_ID/config folder)
   * @default false
   */
  enabled: boolean
  /**
   * This is the value of "Bot User OAuth Access Token" on the page OAuth & Permissions
   * @default your_bot_token
   */
  botToken: string
  /**
   * The value of Signing Secret on page Basic Information
   * @default signin_secret
   */
  signingSecret: string
}

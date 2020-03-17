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

  /**
   * Fetch or not the user information when receiving a message.
   * This uses caching for efficiency.
   * @default true
   */
  fetchUserInfo: boolean

  /**
   * Use the legacy RTM api
   * @default false
   */
  useRTM: boolean

  /**
   * The duration of the authentication session when a user authenticate through this channel.
   * @default 24h
   */
  chatUserAuthDuration: string
}

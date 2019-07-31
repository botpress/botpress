export interface Config {
  enabled: boolean
  /**
   * This is the value of "Bot User OAuth Access Token" on the page OAuth & Permissions
   */
  botToken: string
  /**
   * The value of Signing Secret on page Basic Information
   */
  signingSecret: string
}

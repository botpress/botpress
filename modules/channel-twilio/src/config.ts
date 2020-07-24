export interface Config {
  /**
   * Enable or disable this channel for this bot
   * @default false
   */
  enabled: boolean
  /**
   * Account SID found in the settings page https://www.twilio.com/console/project/settings (must be LIVE Credentials)
   * @default "your accound SID here"
   */
  accountSID: string
  /**
   * Auth Token found in the settings page https://www.twilio.com/console/project/settings (must be LIVE Credentials)
   * @default "your auth token here"
   */
  authToken: string
}

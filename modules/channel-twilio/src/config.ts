/** #TopLevel */
export interface Config {
  /**
   * This this in the LOCAL config (unique to every bot)
   * Whether or not the twilio module is enabled for this bot
   * @default false
   */
  enabled: boolean
  /**
   * This this in the GLOBAL config (same for all bots)
   * The account SID and auth token are the master keys to your account
   * They can be found on your Account Dashboard in the Twilio Console: https://www.twilio.com/console/project/settings
   */
  accountSID: string
  /**
   * This this in the GLOBAL config (same for all bots)
   * The account SID and auth token are the master keys to your account
   * They can be found on your Account Dashboard in the Twilio Console: https://www.twilio.com/console/project/settings
   */
  authToken: string
}



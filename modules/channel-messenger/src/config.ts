export interface Config {
  /**
   * This this in the LOCAL config (unique to every bot/page)
   * Whether or not the messenger module is enabled for this bot
   * @default false
   */
  enabled: boolean
  /**
   * This this in the LOCAL config (unique to every bot/page)
   * The Facebook Page Access Token
   */
  accessToken: string
  /**
   * This this in the GLOBAL config (same for all bots)
   * Your app's "App Secret"
   * Find this secret in your developers.facebook.com -> your app -> Settings -> Basic -> App Secret -> Show
   */
  appSecret: string
  /**
   * Set this in the GLOBAL config (same for all the bots)
   * The verify token, should be a random string unique to your server. This is a random (hard to guess) string of your choosing.
   * @see https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup/#verify_webhook
   */
  verifyToken: string
  /**
   * The greeting message people will see on the welcome screen
   * @see https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/greeting
   */
  greeting?: string
  /**
   * The message of the welcome screen "Get Started" button
   * @see https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/get-started-button
   */
  getStarted?: string
  /**
   * The raw persistent menu object
   * @see https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu/
   * @example
   * {
   *   "persistent_menu":[
   *     {
   *       "locale":"default",
   *       "composer_input_disabled": true,
   *       "call_to_actions":[
   *         {
   *           "title":"My Account",
   *           "type":"nested",
   *           "call_to_actions":[
   *             {
   *               "title":"Pay Bill",
   *               "type":"postback",
   *               "payload":"PAYBILL_PAYLOAD"
   *             },
   *             {
   *               "type":"web_url",
   *               "title":"Latest News",
   *               "url":"https://www.messenger.com/",
   *               "webview_height_ratio":"full"
   *             }
   *           ]
   *         }
   *       ]
   *     }
   *   ]
   * }
   */
  persistentMenu?: any // TODO Type me
}

/** #TopLevel */
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
   * Docs: https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup/#verify_webhook
   */
  verifyToken: string
  /**
   * The greeting message people will see on the welcome screen
   * Docs: https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/greeting
   */
  greeting?: string
  /**
   * The message of the welcome screen "Get Started" button
   * Docs: https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/get-started-button
   */
  getStarted?: string
  /**
   * The raw persistent menu object
   * Docs: https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu
   * @default []
   */
  persistentMenu?: PersistentMenuItem[] | null
}

export interface PersistentMenuItem {
  locale: string
  composer_input_disabled?: boolean
  call_to_actions?: CallToAction[] | null
}

export type CallToAction = WebUrlButton | PostbackButton | NestedButton

export interface WebUrlButton {
  type: 'web_url'
  url: string
  title: string
}

export interface PostbackButton {
  type: 'postback'
  title: string
  payload: string
}

export interface NestedButton {
  type: 'nested'
  title: string
  call_to_actions: CallToAction[]
}

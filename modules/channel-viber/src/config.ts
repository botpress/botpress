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
   * @default 4ca2b2be59000d19-b49363357bf1b496-c941a1ab955b7eb6
   */
  accessToken: string
  /**
   * This this in the GLOBAL config (same for all bots)
   * Your app's "App Secret"
   * Find this secret in your developers.facebook.com -> your app -> Settings -> Basic -> App Secret -> Show
   * @default app_secret
   */
  appSecret: string
  verifyToken?: string
  name?: string
  avatar?: string
  origin: string
  webHook?: string
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

  /**
   * The duration of the authentication session when a user authenticate through this channel.
   * @default 24h
   */
  chatUserAuthDuration?: string
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

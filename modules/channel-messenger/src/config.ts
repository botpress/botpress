export interface Config {
  /**
   * The Facebook Page Access Token
   */
  verifyToken: string
  /**
   * The greeting message people will see on the welcome screen
   */
  greeting?: string
  /**
   * The message of the welcome screen "Get Started" button
   */
  getStarted?: string
  /**
   * The raw persistent menu object
   * @see https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu/
   */
  persistentMenu?
}

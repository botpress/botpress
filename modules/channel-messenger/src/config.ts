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
}

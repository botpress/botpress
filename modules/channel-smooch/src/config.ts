export interface Config {
  /** Enable or disable this channel for this bot
   * @default false
   */
  enabled: boolean

  /** Smooch app id
   * @default "your api key here"
   */
  keyId: string

  /** Smooch secret api key
   * @default "your secret here"
   */
  secret: string

  /**
   * The duration of the authentication session when a user authenticate through this channel.
   * @default 24h
   */
  chatUserAuthDuration: string
}

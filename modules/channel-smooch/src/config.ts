export interface Config {
  /** Enable or disable this channel for this bot */
  enabled: boolean

  /** Smooch app id */
  keyId: string

  /** Smooch secret api key */
  secret: string

  /**
   * The duration of the authentication session when a user authenticate through this channel.
   * @default 24h
   */
  chatUserAuthDuration: string
}

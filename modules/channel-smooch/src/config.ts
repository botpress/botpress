export interface Config {
  /**
   * Enable or disable this channel for this bot
   * @default false
   */
  enabled: boolean

  /**
   * The ID of your API key
   * @default "your api key here"
   */
  keyId: string

  /**
   * Smooch secret api key
   * @default "your secret here"
   */
  secret: string

  /**
   * The duration of the authentication session when a user authenticate through this channel.
   * @default 24h
   */
  chatUserAuthDuration: string

  /**
   * The types of messages received from the channel that will fire off as events in the Dialog Engine
   * @default ['text']
   */
  messageTypes: string[]
}

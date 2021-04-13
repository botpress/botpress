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
   * Configures whether or not payloads that are officially supported by the channel
   * carry over the original smooch payload in payload.channel.smooch
   * @default false
   */
  forwardPayloads: boolean

  /**
   * List of smooch message types to foward. Will be forwarded as an event of with the type prefix "smooch-"
   * @default []
   */
  smoochMessageTypes: string[]
}

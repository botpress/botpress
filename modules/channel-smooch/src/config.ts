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
   * Enables forwarding of raw smooch payloads for the provided payload types.
   * Add the "smooch-" prefix to forward events specific to the smooch channel
   * The raw payload is accessible in event.payload.channel.smooch
   * @example
   * // This would attach the raw payload to text events as well as forward smooch video events
   * ["text", "smooch-video"]
   * @default []
   */
  forwardRawPayloads: string[]
}

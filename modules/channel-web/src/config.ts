export interface Config {
  /**
   * @default false
   */
  uploadsUseS3?: boolean
  /**
   * @default bucket-name
   */
  uploadsS3Bucket?: string
  /**
   * @default eu-west-1
   */
  uploadsS3Region?: string
  /**
   * @default your-aws-key-name
   */
  uploadsS3AWSAccessKey?: string
  /**
   * @default secret-key
   */
  uploadsS3AWSAccessSecret?: string
  /**
   * @default false
   */
  startNewConvoOnTimeout?: boolean
  /**
   * @default 6 hours
   */
  recentConversationLifetime?: string
  /**
   * In case of news messages, even if the scrollbar is not at the bottom,
   * the chat will scroll down to show the new message
   * @default false
   */
  alwaysScrollDownOnMessages?: boolean
  /**
   * @default 360
   */
  maxMessageLength?: number
  /**
   * @deprecated Deprecated in favor of infoPage.  Remove in >= 12
   * @default false
   */
  showBotInfoPage: boolean
  /**
   * Destination of file uploads if S3 is not enabled
   * @default ./uploads
   */
  fileUploadPath: string
  /**
   * The bot information page in the web chat
   */
  infoPage: {
    /**
     * @default false
     */
    enabled: boolean
    description: string
  }
  /**
   * The number of messages that are displayed in the chat history
   * @default 20
   */
  maxMessagesHistory?: number
  /**
   * Security configurations
   */
  security: {
    /**
     * Weather or not to escape plain html payload
     * @default false
     */
    escapeHTML: boolean
  }
  /**
   * The duration of the authentication session when a user authenticate through this channel.
   * @default 24h
   */
  chatUserAuthDuration: string

  /**
   * Path to an additional stylesheet. It will be applied on top of the default style
   */
  extraStylesheet: string

  /**
   * If true, Websocket is created when the Webchat is opened. Bot cannot be proactive.
   * @default false
   */
  lazySocket: boolean

  /**
   * If true, chat will no longer play the notification sound for new messages.
   * @default false
   */
  disableNotificationSound: boolean
}

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
}

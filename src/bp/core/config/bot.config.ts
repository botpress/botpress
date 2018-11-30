export interface LogsConfig {
  /**
   * Logs will be kept in the database for this period of time
   * @default 1 week
   */
  expiration: string
}

export interface DialogConfig {
  /**
   *
   * @default 5m
   */
  timeoutInterval: string
}

export type BotConfig = {
  $schema?: string
  /**
   * An identifier for the bot, represents the folder name on the file system. It is also used in the URL
   */
  id: string
  /**
   * The name of the bot, used for display purpose only
   */
  name: string
  /**
   * @default true
   */
  active: boolean
  description?: string
  author?: string
  /**
   * @default 1.0.0
   */
  version: string
  license?: string
  imports: {
    /** Unused for now */
    modules: string[]
    /**
     * An array of content types that will be available using this bot
     * @default base_text, base_card, base_single_choice
     */
    contentTypes: string[]
    /** Unused for now */
    incomingMiddleware: string[]
    /** Unused for now */
    outgoingMiddleware: string[]
  }
  dialog?: DialogConfig
  logs?: LogsConfig
}

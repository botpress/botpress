export interface Config {
  /**
   * @default ./intents
   */
  intentsDir: string
  /**
   * @default ./entities
   */
  entitiesDir: string
  /**
   * @default ./models
   */
  modelsDir: string

  /** If you compiled fastText yourself and need to point to its location */
  fastTextPath?: string

  /**
   * The minimum confidence required (in %) for an intent to match
   * Set to '0' to always match
   * @default 0.7
   */
  minimumConfidence: number
  /**
   * The maximum confidence after which it is considered a statistical error
   * Mostly irrelevant
   * @default 1
   */
  maximumConfidence: number

  /**
   * @default https://duckling.botpress.io
   */
  ducklingURL: string

  /**
   * @default true
   */
  ducklingEnabled: boolean
}

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

  /**
   * The minimum confidence required (in %) for an intent to match
   * Set to '0' to always match
   * @default 0.7
   */
  confidenceTreshold: number

  /**
   * If you want a fully on-prem installation, you can host
   * Facebook's Duckling on your own infrastructure and change this URL
   * Only relevant if @see ducklingEnabled is true
   * @default https://duckling.botpress.io
   */
  ducklingURL: string

  /**
   * Duckling
   * @default true
   */
  ducklingEnabled: boolean
}

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
   * The name of the NLU provider. Can be native, rasa, luis
   * @default native
   */
  provider: string
  /**
   * Enable logging of debug messages
   * @default true
   */
  debugModeEnabled: boolean
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

  recastToken?: string
  recastUserSlug?: string
  recastBotSlug?: string

  /**
   * @default http://localhost:5000
   */
  rasaEndpoint: string
  rasaToken: string
  /**
   * @default botpress
   */
  rasaProject: string

  luisAppId: string
  luisProgrammaticKey: string
  luisAppSecret: string
  /**
   * @default westus
   */
  luisAppRegion: string

  googleProjectId: string

  /**
   * The maximum number of requests per hour
   * Useful to make sure you don't overuse your budget on paid NLU-services (like LUIS)
   * @default -1
   */
  maximumRequestsPerHour: number
}

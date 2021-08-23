export interface LanguageSource {
  endpoint: string
  authToken?: string
}

type NLUServerConfig = { autoStart: true } | { autoStart: false; endpoint: string }

export interface Config {
  /**
   * If you want to manually start standalone NLU, set autoStart to false and specify endpoint.
   * WARNING: most fields of this configuration file only apply if autoStart is true.
   * @default { "autoStart": true }
   */
  nluServer: NLUServerConfig

  /**
   * If you want a fully on-prem installation, you can host
   * Facebook's Duckling on your own infrastructure and change this URL
   * Only relevant if @see ducklingEnabled is true
   * Only relevant if @see nluServer.autoStart is true
   * @default https://duckling.botpress.io
   */
  ducklingURL: string

  /**
   * @default true
   * Only relevant if @see nluServer.autoStart is true
   */
  ducklingEnabled: boolean

  /**
   * The list of sources to load languages from
   * Only relevant if @see nluServer.autoStart is true
   * @default [{ "endpoint": "https://lang-01.botpress.io" }]
   */
  languageSources: LanguageSource[]

  /**
   * Maximum allowed model cache size
   * Only relevant if @see nluServer.autoStart is true
   * @default 850mb
   */
  modelCacheSize: string

  /**
   * Maximum number of concurrent trainings per Botpress instance
   * Only relevant if @see nluServer.autoStart is true
   * @default 1
   * @optional
   */
  maxTrainingPerInstance?: number

  /**
   * Whether or not to train bots on mount
   * @default false
   * @optional
   */
  queueTrainingOnBotMount?: boolean

  /**
   * Whether or not you want to use the deprecated legacy election
   * @default false
   */
  legacyElection: boolean
}

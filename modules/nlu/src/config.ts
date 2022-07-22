interface LanguageSource {
  endpoint: string
}

type StanConfig = { autoStart: true } | { autoStart: false; endpoint: string }

export interface Config {
  /**
   * If you want to manually start standalone NLU, set autoStart to false and specify endpoint and auth token.
   * @default { "autoStart": true }
   */
  nluServer: StanConfig

  /**
   * If you want a fully on-prem installation, you can host
   * Facebook's Duckling on your own infrastructure and change this URL
   * Only relevant if @see ducklingEnabled is true
   * @default https://duckling.botpress.io
   */
  ducklingURL: string

  /**
   * @default true
   */
  ducklingEnabled: boolean

  /**
   * Whether or not you want your models to be trained and loaded on bot mounts
   * @default true
   * @deprecated > 12.2
   */
  preloadModels: boolean

  /**
   * The list of sources to load languages from
   * @default [{ "endpoint": "https://lang-01.botpress.io" }]
   */
  languageSources: LanguageSource[]

  /**
   * Maximum allowed model cache size
   * @default 850mb
   */
  modelCacheSize: string

  /**
   * Maximum number of concurrent trainings per Botpress instance
   * @default 1
   * @optional
   */
  maxTrainingPerInstance?: number

  /**
   * Whether or not to train bots that require training on mount
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

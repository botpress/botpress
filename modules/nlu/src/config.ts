export interface Config {
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
   * @default true
   */
  ducklingEnabled: boolean

  /**
   * The interval at which to automatically sync the models in the background
   * Set this value to "false" to disable background sync
   * @default 30s
   */
  autoTrainInterval: string

  /**
   * Wheather or not you want your models to be trained on bot mouns
   * @default false
   */
  preloadModels: boolean

  /** The name of the language model to use.
   *  Language models are located in your bot's "global/models" folder and they end with `intent-lm.vec`
   *  The name of the model to use is the prefix of the file (before the first occurence of `__`)
   *  @default en
   */
  languageModel: string

  /**
   * Fine-tuning of the fastText classifier parameters
   * WARNING: For advanced users only
   * @default {}
   */
  fastTextOverrides?: FastTextOverrides
}

export interface FastTextOverrides {
  learningRate?: number
  epoch?: number
  wordNgrams?: number
}

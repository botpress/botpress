export interface LanguageSource {
  endpoint: string
  authToken?: string
}

export interface NLUServerOptions {
  host: string
  port: number
  authToken?: string

  verbose: number
  doc: boolean
  logFilter: string[] | undefined // if undefined, all logs are displayed

  limitWindow?: string
  limit: number
  bodySize: string
  batchSize: number
  dbURL?: string
  modelDir?: string

  // engine options
  languageSources: LanguageSource[]
  ducklingURL: string
  ducklingEnabled: boolean
  modelCacheSize: string

  legacyElection: boolean
}

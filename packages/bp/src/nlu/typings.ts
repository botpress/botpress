export interface LanguageSource {
  endpoint: string
  authToken?: string
}

export interface NLUServerOptions {
  host: string
  port: number
  limitWindow: string
  limit: number
  bodySize: string
  batchSize: number
  modelCacheSize: string
  dbURL?: string
  modelDir?: string
  verbose: number
  doc: boolean
  logFilter?: string[]
  apmEnabled?: boolean
  apmSampleRate?: number
  maxTraining: number
  languageSources: LanguageSource[]
  ducklingURL: string
  ducklingEnabled: boolean
  legacyElection: boolean
}

import child_process from 'child_process'
import path from 'path'

export interface LanguageSource {
  endpoint: string
  authToken?: string
}

export interface StanOptions {
  host: string
  port: number
  authToken?: string
  silent: boolean

  limitWindow?: string
  limit: number
  bodySize: string
  batchSize: number
  dbURL?: string

  // engine options
  languageSources: LanguageSource[]
  ducklingURL: string
  ducklingEnabled: boolean
  modelCacheSize: string
}

const DEFAULT_STAN_OPTIONS: StanOptions = {
  host: 'localhost',
  port: 3200,
  authToken: process.APP_SECRET,
  limit: 0,
  bodySize: '2mb', // should be more than enough based on empirical trials
  batchSize: 1, // one predict at a time
  languageSources: [
    {
      endpoint: 'https://lang-01.botpress.io'
    }
  ],
  ducklingURL: 'https://duckling.botpress.io',
  ducklingEnabled: true,
  modelCacheSize: '850mb',
  silent: true
}

export const runStan = (opts: Partial<StanOptions>): Promise<{ code: number | null; signal: string | null }> => {
  const options = { ...DEFAULT_STAN_OPTIONS, ...opts }

  return new Promise((resolve, reject) => {
    try {
      const STAN_JSON_CONFIG = JSON.stringify(options)
      const command = path.join(__dirname, 'index.js') // TODO change this when we have a bin
      const stanProcess = child_process.fork(command, ['nlu'], {
        env: { ...process.env, STAN_JSON_CONFIG },
        stdio: 'inherit'
      })

      stanProcess.on('exit', (code, signal) => {
        resolve({ code, signal })
      })
    } catch (err) {
      reject(err)
    }
  })
}

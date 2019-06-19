import axios, { AxiosInstance } from 'axios'
import retry from 'bluebird-retry'
import lru from 'lru-cache'
import moment from 'moment'

import { LangsGateway, LanguageProvider, LanguageSource } from './typings'

const debug = DEBUG('nlu').sub('lang')
const maxAgeCacheInMS = 86400000

export class RemoteLanguageProvider implements LanguageProvider {
  private _vectorsCache
  private _tokensCache

  private discoveryRetryPolicy = {
    interval: 1000,
    max_interval: 5000,
    timeout: 2000,
    max_tries: 5
  }

  private langs: LangsGateway = {}

  private addProvider(lang: string, source: LanguageSource, client: AxiosInstance) {
    this.langs[lang] = [...(this.langs[lang] || []), { source, client, errors: 0, disabledUntil: undefined }]
  }

  async initialize(sources: LanguageSource[]): Promise<LanguageProvider> {
    this._tokensCache = new lru({
      maxAge: maxAgeCacheInMS
    })

    this._vectorsCache = new lru({
      maxAge: maxAgeCacheInMS
    })

    await Promise.mapSeries(sources, async source => {
      const headers = {}

      if (source.authToken) {
        headers['authorization'] = 'bearer ' + source.authToken
      }

      const client = axios.create({ baseURL: source.endpoint, headers })

      await retry(async () => {
        const { data } = await client.get('/info')

        if (!data.ready) {
          throw new Error('Language source is not ready')
        }

        data.languages.forEach(x => this.addProvider(x.lang, source, client))
      }, this.discoveryRetryPolicy)
    })

    debug(`loaded ${Object.keys(this.langs).length} languages from ${sources.length} sources`)

    return this
  }

  private async queryProvider<T>(lang: string, path: string, body: any, returnProperty: string): Promise<T> {
    const providers = this.langs[lang]

    if (!providers) {
      throw new Error(`Language "${lang}" is not supported by the configured language sources`)
    }

    for (const provider of providers) {
      if (provider.disabledUntil > new Date()) {
        debug('source disabled, skipping', {
          source: provider.source,
          errors: provider.errors,
          until: provider.disabledUntil
        })
        continue
      }

      try {
        const { data } = await provider.client.post(path, { ...body, lang })

        if (data && data[returnProperty]) {
          return data[returnProperty] as T
        }

        return data
      } catch (err) {
        provider.disabledUntil = moment()
          .add(provider.errors++, 'seconds')
          .toDate()

        debug('disabled temporarily source', {
          source: provider.source,
          err: err.message,
          errors: provider.errors,
          until: provider.disabledUntil
        })
      }
    }

    throw new Error(`No provider could successfully fullfil request "${path}" for lang "${lang}"`)
  }

  async vectorize(tokens: string[], lang: string): Promise<number[][]> {
    if (!tokens.length) {
      return []
    }

    const text = tokens.reduce((a, b) => a + b, '')
    const cacheKey = `${lang}_${encodeURI(text)}`

    if (this._vectorsCache.has(cacheKey)) {
      return this._vectorsCache.get(cacheKey)
    }

    const vectors = await this.queryProvider<number[][]>(lang, '/vectorize', { tokens }, 'vectors')
    this._vectorsCache.set(cacheKey, vectors)
    return vectors
  }

  async tokenize(text: string, lang: string): Promise<string[]> {
    if (!text.length) {
      return []
    }

    const cacheKey = `${lang}_${encodeURIComponent(text)}`

    if (this._tokensCache.has(cacheKey)) {
      return this._tokensCache.get(cacheKey)
    }

    const tokens = await this.queryProvider<string[]>(lang, '/tokenize', { input: text }, 'tokens')
    this._tokensCache.set(cacheKey, tokens)
    return tokens
  }
}

export default new RemoteLanguageProvider()

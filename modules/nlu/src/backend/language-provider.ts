import axios, { AxiosInstance } from 'axios'
import retry from 'bluebird-retry'
import moment from 'moment'

import { LangsGateway, LanguageProvider, LanguageSource } from './typings'

const debug = DEBUG('nlu').sub('lang')

export class RemoteLanguageProvider implements LanguageProvider {
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

    return this.queryProvider(lang, '/vectorize', { tokens }, 'vectors')
  }

  async tokenize(text: string, lang: string): Promise<string[]> {
    if (!text.length) {
      return []
    }

    return this.queryProvider(lang, '/tokenize', { input: text }, 'tokens')
  }
}

export default new RemoteLanguageProvider()

import axios, { AxiosInstance } from 'axios'
import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import fse from 'fs-extra'
import _, { debounce, sumBy } from 'lodash'
import lru from 'lru-cache'
import moment from 'moment'
import ms from 'ms'
import path from 'path'

import { setSimilarity, vocabNGram } from './tools/strings'
import { LangsGateway, LanguageProvider, LanguageSource, NLUHealth } from './typings'

const debug = DEBUG('nlu').sub('lang')

const maxAgeCacheInMS = ms('7d')
const JUNK_VOCAB_SIZE = 500
const JUNK_TOKEN_MIN = 1
const JUNK_TOKEN_MAX = 20

export class RemoteLanguageProvider implements LanguageProvider {
  private _vectorsCache: lru<string, Float32Array>
  private _vectorsCachePath = path.join(process.APP_DATA_PATH, 'cache', 'lang_vectors.json')
  private _junkwordsCachePath = path.join(process.APP_DATA_PATH, 'cache', 'junk_words.json')

  private _tokensCache: lru<string, string[]>
  private _junkwordsCache: lru<string[], string[]>

  private _cacheDumpDisabled: boolean = false
  private _validProvidersCount: number

  private discoveryRetryPolicy = {
    interval: 1000,
    max_interval: 5000,
    timeout: 2000,
    max_tries: 5
  }

  private langs: LangsGateway = {}

  private addProvider(lang: string, source: LanguageSource, client: AxiosInstance) {
    this.langs[lang] = [...(this.langs[lang] || []), { source, client, errors: 0, disabledUntil: undefined }]
    debug(`[${lang.toUpperCase()}] Language Provider added %o`, source)
  }

  async initialize(sources: LanguageSource[], logger: typeof sdk.logger): Promise<LanguageProvider> {
    this._vectorsCache = new lru<string, Float32Array>({
      length: (arr: Float32Array) => {
        if (arr && arr.BYTES_PER_ELEMENT) {
          return arr.length * arr.BYTES_PER_ELEMENT
        } else {
          return 300 /* dim */ * Float32Array.BYTES_PER_ELEMENT
        }
      },
      max: 300 /* dim */ * Float32Array.BYTES_PER_ELEMENT /* bytes */ * 500000 /* tokens */
    })

    this._tokensCache = new lru<string, string[]>({
      maxAge: maxAgeCacheInMS
    })
    this._validProvidersCount = 0

    this._junkwordsCache = new lru<string[], string[]>({
      length: (val: string[], key: string[]) => sumBy(key, x => x.length * 4) + sumBy(val, x => x.length * 4),
      max:
        4 * // bytes in strings
        10 * // token size
        500 * // vocab size
        1000 * // junk words
        10 // models
      // total is ~ 200 mb
    })

    await Promise.mapSeries(sources, async source => {
      const headers = {}

      if (source.authToken) {
        headers['authorization'] = 'bearer ' + source.authToken
      }

      const client = axios.create({ baseURL: source.endpoint, headers })
      try {
        await retry(async () => {
          const { data } = await client.get('/info')

          if (!data.ready) {
            throw new Error('Language source is not ready')
          }

          this._validProvidersCount++
          data.languages.forEach(x => this.addProvider(x.lang, source, client))
        }, this.discoveryRetryPolicy)
      } catch (err) {
        logger.attachError(err).error(`Could not load Language Provider at ${source.endpoint}: ${err.code}`)
      }
    })

    debug(`loaded ${Object.keys(this.langs).length} languages from ${sources.length} sources`)

    this.restoreVectorsCache()
    this.restoreJunkWordsCache()

    return this
  }

  private onVectorsCacheChanged = debounce(() => {
    if (!this._cacheDumpDisabled) {
      this.dumpVectorsCache()
    }
  }, ms('5s'))

  private onJunkWordsCacheChanged = debounce(() => {
    if (!this._cacheDumpDisabled) {
      this.dumpJunkWordsCache()
    }
  }, ms('5s'))

  private dumpVectorsCache() {
    try {
      fse.ensureFileSync(this._vectorsCachePath)
      fse.writeJSONSync(this._vectorsCachePath, this._vectorsCache.dump())
      debug('vectors cache updated at: %s', this._vectorsCachePath)
    } catch (err) {
      debug('could not persist vectors cache, error: %s', err.message)
      this._cacheDumpDisabled = true
    }
  }

  private restoreVectorsCache() {
    try {
      if (fse.existsSync(this._vectorsCachePath)) {
        const dump = fse.readJSONSync(this._vectorsCachePath)
        if (dump) {
          const kve = dump.map(x => ({ e: x.e, k: x.k, v: Float32Array.from(Object.values(x.v)) }))
          this._vectorsCache.load(kve)
        }
      }
    } catch (err) {
      debug('could not restore vectors cache, error: %s', err.message)
    }
  }

  private dumpJunkWordsCache() {
    try {
      fse.ensureFileSync(this._junkwordsCachePath)
      fse.writeJSONSync(this._junkwordsCachePath, this._junkwordsCache.dump())
      debug('junk words cache updated at: %s', this._junkwordsCache)
    } catch (err) {
      debug('could not persist junk cache, error: %s', err.message)
      this._cacheDumpDisabled = true
    }
  }

  private restoreJunkWordsCache() {
    try {
      if (fse.existsSync(this._junkwordsCachePath)) {
        const dump = fse.readJSONSync(this._junkwordsCachePath)
        this._vectorsCache.load(dump)
      }
    } catch (err) {
      debug('could not restore junk cache, error: %s', err.message)
    }
  }

  getHealth(): Partial<NLUHealth> {
    return { validProvidersCount: this._validProvidersCount, validLanguages: Object.keys(this.langs) }
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

  /**
   * Generates words that don't exist in the vocabulary, but that are built from ngrams of existing vocabulary
   * @param subsetVocab The tokens to which you want similar tokens to
   */
  async generateSimilarJunkWords(subsetVocab: string[]): Promise<string[]> {
    // from totalVocab compute the cachedKey the closest to what we have
    // if 75% of the vocabulary is the same, we keep the cache we have instead of rebuilding one
    const gramset = vocabNGram(subsetVocab)
    let result: string[] | undefined

    this._junkwordsCache.forEach((junk, vocab) => {
      if (!result) {
        const sim = setSimilarity(vocab, gramset)
        if (sim >= 0.75) {
          result = junk
        }
      }
    })

    if (!result) {
      // didn't find any close gramset, let's create a new one
      const realWords = _.uniq(subsetVocab)
      const meanWordSize = _.meanBy(realWords, w => w.length)
      const minJunkSize = Math.max(JUNK_TOKEN_MIN, meanWordSize / 3)
      const maxJunkSize = Math.min(JUNK_TOKEN_MAX, meanWordSize * 1.5)

      result = _.range(0, JUNK_VOCAB_SIZE).map(() =>
        _.sampleSize(gramset, _.random(minJunkSize, maxJunkSize, false)).join('')
      ) // randomly generated words

      this._junkwordsCache.set(gramset, result)
      this.onJunkWordsCacheChanged()
    }

    return result
  }

  async vectorize(tokens: string[], lang: string): Promise<Float32Array[]> {
    if (!tokens.length) {
      return []
    }

    const vectors: Float32Array[] = Array(tokens.length)
    const idxToFetch: number[] = [] // the tokens we need to fetch remotely
    const getCacheKey = (t: string) => `${lang}_${encodeURI(t)}`

    tokens.forEach((token, i) => {
      if (this._vectorsCache.has(getCacheKey(token))) {
        vectors[i] = this._vectorsCache.get(getCacheKey(token))
      } else {
        idxToFetch.push(i)
      }
    })

    if (idxToFetch.length) {
      // We have new tokens we haven't cached yet
      const query = idxToFetch.map(idx => tokens[idx])
      // Fetch only the missing tokens
      const fetched = await this.queryProvider<number[][]>(lang, '/vectorize', { tokens: query }, 'vectors')

      if (fetched.length !== query.length) {
        throw new Error(
          `Language Provider didn't receive as many vectors as we asked for (asked ${query.length} and received ${
            fetched.length
          })`
        )
      }

      // Reconstruct them in our array and cache them for future cache lookup
      idxToFetch.forEach((tokenIdx, fetchIdx) => {
        vectors[tokenIdx] = Float32Array.from(fetched[fetchIdx])
        this._vectorsCache.set(getCacheKey(tokens[tokenIdx]), vectors[tokenIdx])
      })

      this.onVectorsCacheChanged()
    }

    return vectors
  }

  async tokenize(text: string, lang: string): Promise<string[]> {
    if (!text.length) {
      return []
    }

    const cacheKey = `${lang}_${encodeURI(text)}`

    if (this._tokensCache.has(cacheKey)) {
      return this._tokensCache.get(cacheKey)
    }

    const tokens = await this.queryProvider<string[]>(lang, '/tokenize', { input: text }, 'tokens')
    this._tokensCache.set(cacheKey, tokens)
    return tokens
  }
}

export default new RemoteLanguageProvider()

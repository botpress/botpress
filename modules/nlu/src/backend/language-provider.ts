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
import { Gateway, LangsGateway, LanguageProvider, LanguageSource, NLUHealth } from './typings'

const debug = DEBUG('nlu').sub('lang')

const MAX_PAYLOAD_SIZE = 150 * 1024 // 150kb
const JUNK_VOCAB_SIZE = 500
const JUNK_TOKEN_MIN = 1
const JUNK_TOKEN_MAX = 20

export class RemoteLanguageProvider implements LanguageProvider {
  private _vectorsCachePath = path.join(process.APP_DATA_PATH, 'cache', 'lang_vectors.json')
  private _junkwordsCachePath = path.join(process.APP_DATA_PATH, 'cache', 'junk_words.json')
  private _tokensCachePath = path.join(process.APP_DATA_PATH, 'cache', 'utterance_tokens.json')

  private _vectorsCache: lru<string, Float32Array>
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
    this._validProvidersCount = 0

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
      length: (val: string[], key: string) => key.length * 4 + sumBy(val, x => x.length * 4),
      max:
        4 * // bytes in strings
        5 * // average size of token
        10 * // nb of tokens per utterance
        10 * // nb of utterances per intent
        200 * // nb of intents per model
        10 * // nb of models per bot
        50 // nb of bots
      // total is ~ 200 mb
    })

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
        this.handleLanguageServerError(err, source.endpoint, logger)
      }
    })

    debug(`loaded ${Object.keys(this.langs).length} languages from ${sources.length} sources`)

    this.restoreVectorsCache()
    this.restoreJunkWordsCache()
    this.restoreTokensCache()

    return this
  }

  private handleLanguageServerError = (err, endpoint: string, logger) => {
    const status = _.get(err, 'failure.response.status')
    const details = _.get(err, 'failure.response.message')

    if (status === 429) {
      logger.error(
        `Could not load Language Server: ${details}. You may be over the limit for the number of requests allowed for the endpoint ${endpoint}`
      )
    } else if (status === 401) {
      logger.error(`You must provide a valid authentication token for the endpoint ${endpoint}`)
    } else {
      logger.attachError(err).error(`Could not load Language Provider at ${endpoint}: ${err.code}`)
    }
  }

  private onTokensCacheChanged = debounce(() => {
    if (!this._cacheDumpDisabled) {
      this.dumpTokensCache()
    }
  }, ms('5s'))

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

  private dumpTokensCache() {
    try {
      fse.ensureFileSync(this._tokensCachePath)
      fse.writeJSONSync(this._tokensCachePath, this._tokensCache.dump())
      debug('tokens cache updated at: %s', this._tokensCachePath)
    } catch (err) {
      debug('could not persist tokens cache, error: %s', err.message)
      this._cacheDumpDisabled = true
    }
  }

  private restoreTokensCache() {
    try {
      if (fse.existsSync(this._tokensCachePath)) {
        const dump = fse.readJSONSync(this._tokensCachePath)
        this._tokensCache.load(dump)
      }
    } catch (err) {
      debug('could not restore tokens cache, error: %s', err.message)
    }
  }

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

  private getAvailableProviders(lang: string): Gateway[] {
    if (!this.langs[lang]) {
      throw new Error(`Language "${lang}" is not supported by the configured language sources`)
    }

    return this.langs[lang].filter(x => !x.disabledUntil || x.disabledUntil <= new Date())
  }

  private async queryProvider<T>(lang: string, path: string, body: any, returnProperty: string): Promise<T> {
    const providers = this.getAvailableProviders(lang)

    for (const provider of providers) {
      try {
        const { data } = await provider.client.post(path, { ...body, lang })

        if (data && data[returnProperty]) {
          return data[returnProperty] as T
        }

        return data
      } catch (err) {
        debug('error from language server', { message: err.message, code: err.code, status: err.status, payload: body })

        if (this.getAvailableProviders(lang).length > 1) {
          // we don't disable providers when there's no backup
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
    }

    throw new Error(`No provider could successfully fullfil request "${path}" for lang "${lang}"`)
  }

  /**
   * Generates words that don't exist in the vocabulary, but that are built from ngrams of existing vocabulary
   * @param subsetVocab The tokens to which you want similar tokens to
   */
  async generateSimilarJunkWords(subsetVocab: string[], lang: string): Promise<string[]> {
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
      result = this.generateJunkWords(subsetVocab, gramset) // randomly generated words
      await this.vectorize(result, lang) // vectorize them all in one request to cache the tokens
      this._junkwordsCache.set(gramset, result)
      this.onJunkWordsCacheChanged()
    }

    return result
  }

  private generateJunkWords(subsetVocab: string[], gramset: string[]) {
    const realWords = _.uniq(subsetVocab)
    const meanWordSize = _.meanBy(realWords, w => w.length)
    const minJunkSize = Math.max(JUNK_TOKEN_MIN, meanWordSize / 2) // Twice as short
    const maxJunkSize = Math.min(JUNK_TOKEN_MAX, meanWordSize * 1.5) // A bit longer.  Those numbers are discretionary and are not expected to make a big impact on the models.
    return _.range(0, JUNK_VOCAB_SIZE).map(() => {
      const finalSize = _.random(minJunkSize, maxJunkSize, false)
      let word = ''
      while (word.length < finalSize) {
        word += _.sample(gramset)
      }
      return word
    }) // randomly generated words
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

    while (idxToFetch.length) {
      // we tokenize maximum 100 tokens at the same time
      const group = idxToFetch.splice(0, 100)

      // We have new tokens we haven't cached yet
      const query = group.map(idx => tokens[idx])
      // Fetch only the missing tokens
      if (!query.length) {
        break
      }

      const fetched = await this.queryProvider<number[][]>(lang, '/vectorize', { tokens: query }, 'vectors')

      if (fetched.length !== query.length) {
        throw new Error(
          `Language Provider didn't receive as many vectors as we asked for (asked ${query.length} and received ${
            fetched.length
          })`
        )
      }

      // Reconstruct them in our array and cache them for future cache lookup
      group.forEach((tokenIdx, fetchIdx) => {
        vectors[tokenIdx] = Float32Array.from(fetched[fetchIdx])
        this._vectorsCache.set(getCacheKey(tokens[tokenIdx]), vectors[tokenIdx])
      })

      this.onVectorsCacheChanged()
    }

    return vectors
  }

  async tokenize(utterances: string[], lang: string): Promise<string[][]> {
    if (!utterances.length) {
      return []
    }

    const getCacheKey = (t: string) => `${lang}_${encodeURI(t)}`
    const final: string[][] = Array(utterances.length)
    const idxToFetch: number[] = [] // the utterances we need to fetch remotely

    utterances.forEach((utterance, idx) => {
      if (this._tokensCache.has(getCacheKey(utterance))) {
        final[idx] = this._tokensCache.get(getCacheKey(utterance))
      } else {
        idxToFetch.push(idx)
      }
    })

    // At this point, final[] contains the utterances we had cached
    // It has somes "holes", we kept track of the indices where those wholes are in `idxToFetch`

    while (idxToFetch.length) {
      // While there's utterances we haven't tokenized yet
      // We're going to batch requests by maximum 150KB worth's of utterances
      let totalSize = 0
      const sliceUntil = idxToFetch.reduce((topIdx, idx, i) => {
        if ((totalSize += utterances[idx].length * 4) < MAX_PAYLOAD_SIZE) {
          return i
        } else {
          return topIdx
        }
      }, 0)
      const batch = idxToFetch.splice(0, sliceUntil + 1)
      const query = batch.map(idx => utterances[idx])

      if (!query.length) {
        break
      }

      const fetched = await this.queryProvider<string[][]>(lang, '/tokenize', { utterances: query }, 'tokens')

      if (fetched.length !== query.length) {
        throw new Error(
          `Language Provider didn't receive as many utterances as we asked for (asked ${query.length} and received ${
            fetched.length
          })`
        )
      }

      // Reconstruct them in our array and cache them for future cache lookup
      batch.forEach((utteranceIdx, fetchIdx) => {
        final[utteranceIdx] = Array.from(fetched[fetchIdx])
        this._tokensCache.set(getCacheKey(utterances[utteranceIdx]), final[utteranceIdx])
      })

      this.onTokensCacheChanged()
    }

    return final
  }
}

export default new RemoteLanguageProvider()

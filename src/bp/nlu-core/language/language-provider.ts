import axios, { AxiosInstance } from 'axios'
import retry from 'bluebird-retry'
import { NLU } from 'botpress/sdk'
import crypto from 'crypto'
import fse from 'fs-extra'
import httpsProxyAgent from 'https-proxy-agent'
import _, { debounce, sumBy } from 'lodash'
import lru from 'lru-cache'
import moment from 'moment'
import ms from 'ms'
import path from 'path'
import semver from 'semver'

import { setSimilarity, vocabNGram } from '../tools/strings'
import { isSpace, processUtteranceTokens, restoreOriginalUtteranceCasing } from '../tools/token-utils'
import { Gateway, LangServerInfo, LangsGateway, LanguageProvider, SeededLodashProvider, Token2Vec } from '../typings'

const debug = DEBUG('nlu').sub('lang')

const MAX_PAYLOAD_SIZE = 150 * 1024 // 150kb
const JUNK_VOCAB_SIZE = 500
const JUNK_TOKEN_MIN = 1
const JUNK_TOKEN_MAX = 20

const VECTOR_FILE_PREFIX = 'lang_vectors'
const TOKEN_FILE_PREFIX = 'utterance_tokens'
const JUNK_FILE_PREFIX = 'junk_words'

export class RemoteLanguageProvider implements LanguageProvider {
  private _cacheDir = path.join(process.APP_DATA_PATH, 'cache')
  private _vectorsCachePath!: string
  private _junkwordsCachePath!: string
  private _tokensCachePath!: string

  private _vectorsCache!: lru<string, Float32Array>
  private _tokensCache!: lru<string, string[]>
  private _junkwordsCache!: lru<string[], string[]>

  private _cacheDumpDisabled: boolean = false
  private _validProvidersCount!: number
  private _languageDims!: number

  private _nluVersion!: string
  private _langServerInfo!: LangServerInfo

  private _seededLodashProvider!: SeededLodashProvider

  private discoveryRetryPolicy = {
    interval: 1000,
    max_interval: 5000,
    timeout: 2000,
    max_tries: 5
  }

  private langs: LangsGateway = {}

  get languages(): string[] {
    return Object.keys(this.langs)
  }

  private addProvider(lang: string, source: NLU.LanguageSource, client: AxiosInstance) {
    this.langs[lang] = [...(this.langs[lang] || []), { source, client, errors: 0, disabledUntil: undefined }]
    debug(`[${lang.toUpperCase()}] Language Provider added %o`, source)
  }

  async initialize(
    sources: NLU.LanguageSource[],
    logger: NLU.Logger,
    nluVersion: string,
    seededLodashProvider: SeededLodashProvider
  ): Promise<LanguageProvider> {
    this._nluVersion = nluVersion
    this._validProvidersCount = 0

    this._seededLodashProvider = seededLodashProvider

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
      const headers: _.Dictionary<string> = {}

      if (source.authToken) {
        headers['authorization'] = `bearer ${source.authToken}`
      }

      const proxyConfig = process.PROXY ? { httpsAgent: new httpsProxyAgent(process.PROXY) } : {}

      const client = axios.create({
        baseURL: source.endpoint,
        headers,
        ...proxyConfig
      })
      try {
        await retry(async () => {
          const { data } = await client.get('/info')

          if (!data.ready) {
            throw new Error('Language source is not ready')
          }

          if (!this._languageDims) {
            this._languageDims = data.dimentions // note typo in language server
          }

          // TODO: also check that the domain and version is consistent across all sources
          if (this._languageDims !== data.dimentions) {
            throw new Error('Language sources have different dimensions')
          }
          this._validProvidersCount++
          data.languages.forEach(x => this.addProvider(x.lang, source, client))

          this.extractLangServerInfo(data)
        }, this.discoveryRetryPolicy)
      } catch (err) {
        this.handleLanguageServerError(err, source.endpoint, logger)
      }
    })

    this.computeCacheFilesPaths()
    await this.clearOldCacheFiles()

    debug(`loaded ${Object.keys(this.langs).length} languages from ${sources.length} sources`)

    await this.restoreVectorsCache()
    await this.restoreJunkWordsCache()
    await this.restoreTokensCache()

    return this as LanguageProvider
  }

  public get langServerInfo(): LangServerInfo {
    return this._langServerInfo
  }

  private extractLangServerInfo(data) {
    const version = semver.valid(semver.coerce(data.version))

    if (!version) {
      throw new Error('Lang server has an invalid version')
    }
    const langServerInfo = {
      version: semver.clean(version),
      dim: data.dimentions,
      domain: data.domain
    }
    this._langServerInfo = langServerInfo
  }

  private computeCacheFilesPaths = () => {
    const versionHash = this.computeVersionHash()
    this._vectorsCachePath = path.join(this._cacheDir, `${VECTOR_FILE_PREFIX}_${versionHash}.json`)
    this._junkwordsCachePath = path.join(this._cacheDir, `${JUNK_FILE_PREFIX}_${versionHash}.json`)
    this._tokensCachePath = path.join(this._cacheDir, `${TOKEN_FILE_PREFIX}_${versionHash}.json`)
  }

  private clearOldCacheFiles = async () => {
    const cacheExists = await fse.pathExists(this._cacheDir)
    if (!cacheExists) {
      return
    }

    const allCacheFiles = await fse.readdir(this._cacheDir)

    const currentHash = this.computeVersionHash()

    const fileStartWithPrefix = (fileName: string) => {
      return (
        fileName.startsWith(VECTOR_FILE_PREFIX) ||
        fileName.startsWith(TOKEN_FILE_PREFIX) ||
        fileName.startsWith(JUNK_FILE_PREFIX)
      )
    }

    const fileEndsWithIncorrectHash = (fileName: string) => !fileName.includes(currentHash)

    const filesToDelete = allCacheFiles
      .filter(fileStartWithPrefix)
      .filter(fileEndsWithIncorrectHash)
      .map(f => path.join(this._cacheDir, f))

    for (const f of filesToDelete) {
      await fse.unlink(f)
    }
  }

  private handleLanguageServerError = (err, endpoint: string, logger: NLU.Logger) => {
    const status = _.get(err, 'failure.response.status')
    const details = _.get(err, 'failure.response.message')

    if (status === 429) {
      logger.error(
        `Could not load Language Server: ${details}. You may be over the limit for the number of requests allowed for the endpoint ${endpoint}`
      )
    } else if (status === 401) {
      logger.error(`You must provide a valid authentication token for the endpoint ${endpoint}`)
    } else {
      logger.error(`Could not load Language Provider at ${endpoint}: ${err.code}`, err)
    }
  }

  private onTokensCacheChanged = debounce(async () => {
    if (!this._cacheDumpDisabled) {
      await this.dumpTokensCache()
    }
  }, ms('5s'))

  private onVectorsCacheChanged = debounce(async () => {
    if (!this._cacheDumpDisabled) {
      await this.dumpVectorsCache()
    }
  }, ms('5s'))

  private onJunkWordsCacheChanged = debounce(async () => {
    if (!this._cacheDumpDisabled) {
      await this.dumpJunkWordsCache()
    }
  }, ms('5s'))

  private async dumpTokensCache() {
    try {
      await fse.ensureFile(this._tokensCachePath)
      await fse.writeJson(this._tokensCachePath, this._tokensCache.dump())
      debug('tokens cache updated at: %s', this._tokensCachePath)
    } catch (err) {
      debug('could not persist tokens cache, error: %s', err.message)
      this._cacheDumpDisabled = true
    }
  }

  private async restoreTokensCache() {
    try {
      if (await fse.pathExists(this._tokensCachePath)) {
        const dump = await fse.readJSON(this._tokensCachePath)
        this._tokensCache.load(dump)
      }
    } catch (err) {
      debug('could not restore tokens cache, error: %s', err.message)
    }
  }

  private async dumpVectorsCache() {
    try {
      await fse.ensureFile(this._vectorsCachePath)
      await fse.writeJSON(this._vectorsCachePath, this._vectorsCache.dump())
      debug('vectors cache updated at: %s', this._vectorsCachePath)
    } catch (err) {
      debug('could not persist vectors cache, error: %s', err.message)
      this._cacheDumpDisabled = true
    }
  }

  private async restoreVectorsCache() {
    try {
      if (await fse.pathExists(this._vectorsCachePath)) {
        const dump = await fse.readJSON(this._vectorsCachePath)
        if (dump) {
          const kve = dump.map(x => ({ e: x.e, k: x.k, v: Float32Array.from(Object.values(x.v)) }))
          this._vectorsCache.load(kve)
        }
      }
    } catch (err) {
      debug('could not restore vectors cache, error: %s', err.message)
    }
  }

  private async dumpJunkWordsCache() {
    try {
      await fse.ensureFile(this._junkwordsCachePath)
      await fse.writeJSON(this._junkwordsCachePath, this._junkwordsCache.dump())
      debug('junk words cache updated at: %s', this._junkwordsCache)
    } catch (err) {
      debug('could not persist junk cache, error: %s', err.message)
      this._cacheDumpDisabled = true
    }
  }

  private async restoreJunkWordsCache() {
    try {
      if (await fse.pathExists(this._junkwordsCachePath)) {
        const dump = await fse.readJSON(this._junkwordsCachePath)
        this._vectorsCache.load(dump)
      }
    } catch (err) {
      debug('could not restore junk cache, error: %s', err.message)
    }
  }

  getHealth(): Partial<NLU.Health> {
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
    // TODO: we can remove await + lang
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
      await this.vectorize(result, lang) // vectorize them all in one request to cache the tokens // TODO: remove this
      this._junkwordsCache.set(gramset, result)
      await this.onJunkWordsCacheChanged()
    }

    return result
  }

  private generateJunkWords(subsetVocab: string[], gramset: string[]) {
    const realWords = _.uniq(subsetVocab)
    const meanWordSize = _.meanBy(realWords, w => w.length)
    const minJunkSize = Math.max(JUNK_TOKEN_MIN, meanWordSize / 2) // Twice as short
    const maxJunkSize = Math.min(JUNK_TOKEN_MAX, meanWordSize * 1.5) // A bit longer.  Those numbers are discretionary and are not expected to make a big impact on the models.

    const lo = this._seededLodashProvider.getSeededLodash()

    const junks = _.range(0, JUNK_VOCAB_SIZE).map(() => {
      const finalSize = lo.random(minJunkSize, maxJunkSize, false)
      let word = ''
      while (word.length < finalSize) {
        word += lo.sample(gramset)
      }
      return word
    }) // randomly generated words

    return junks
  }

  async vectorize(tokens: string[], lang: string): Promise<Float32Array[]> {
    if (!tokens.length) {
      return []
    }

    const vectors: Float32Array[] = Array(tokens.length)
    const idxToFetch: number[] = [] // the tokens we need to fetch remotely
    const getCacheKey = (t: string) => `${lang}_${encodeURI(t)}`

    tokens.forEach((token, i) => {
      if (isSpace(token)) {
        vectors[i] = new Float32Array(this._languageDims) // float 32 Arrays are initialized with 0s
      } else if (this._vectorsCache.has(getCacheKey(token))) {
        vectors[i] = this._vectorsCache.get(getCacheKey(token))!
      } else {
        idxToFetch.push(i)
      }
    })

    while (idxToFetch.length) {
      // we tokenize maximum 100 tokens at the same time
      const group = idxToFetch.splice(0, 100)

      // We have new tokens we haven't cached yet
      const query = group.map(idx => tokens[idx].toLowerCase())
      // Fetch only the missing tokens
      if (!query.length) {
        break
      }

      const fetched = await this.queryProvider<number[][]>(lang, '/vectorize', { tokens: query }, 'vectors')

      if (fetched.length !== query.length) {
        throw new Error(
          `Language Provider didn't receive as many vectors as we asked for (asked ${query.length} and received ${fetched.length})`
        )
      }

      // Reconstruct them in our array and cache them for future cache lookup
      group.forEach((tokenIdx, fetchIdx) => {
        vectors[tokenIdx] = Float32Array.from(fetched[fetchIdx])
        this._vectorsCache.set(getCacheKey(tokens[tokenIdx]), vectors[tokenIdx])
      })

      await this.onVectorsCacheChanged()
    }

    return vectors
  }

  async tokenize(utterances: string[], lang: string, vocab: string[] = []): Promise<string[][]> {
    if (!utterances.length) {
      return []
    }

    const getCacheKey = (t: string) => `${lang}_${encodeURI(t)}`
    const tokenUtterances: string[][] = Array(utterances.length)
    const idxToFetch: number[] = [] // the utterances we need to fetch remotely

    utterances.forEach((utterance, idx) => {
      if (this._tokensCache.has(getCacheKey(utterance))) {
        tokenUtterances[idx] = this._tokensCache.get(getCacheKey(utterance))!
      } else {
        idxToFetch.push(idx)
      }
    })

    // At this point, final[] contains the utterances we had cached
    // It has some "holes", we kept track of the indices where those wholes are in `idxToFetch`

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
      const query = batch.map(idx => utterances[idx].toLowerCase())

      if (!query.length) {
        break
      }

      let fetched = await this.queryProvider<string[][]>(lang, '/tokenize', { utterances: query }, 'tokens')
      fetched = fetched.map(toks => processUtteranceTokens(toks, vocab))

      if (fetched.length !== query.length) {
        throw new Error(
          `Language Provider didn't receive as many utterances as we asked for (asked ${query.length} and received ${fetched.length})`
        )
      }

      // Reconstruct them in our array and cache them for future cache lookup
      batch.forEach((utteranceIdx, fetchIdx) => {
        tokenUtterances[utteranceIdx] = Array.from(fetched[fetchIdx])
        this._tokensCache.set(getCacheKey(utterances[utteranceIdx]), tokenUtterances[utteranceIdx])
      })

      await this.onTokensCacheChanged()
    }

    // we restore original chars and casing
    return tokenUtterances.map((tokens, i) => restoreOriginalUtteranceCasing(tokens, utterances[i]))
  }

  private computeVersionHash = () => {
    const { _nluVersion, _langServerInfo } = this
    const { dim, domain, version: langServerVersion } = _langServerInfo

    const omitPatchNumber = (v: string) => `${semver.major(v)}.${semver.minor(v)}.0`
    const hashContent = `${omitPatchNumber(_nluVersion)}:${omitPatchNumber(langServerVersion)}:${dim}:${domain}`
    return crypto
      .createHash('md5')
      .update(hashContent)
      .digest('hex')
  }
}

export default new RemoteLanguageProvider()

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import crypto from 'crypto'
import { EventEmitter2 } from 'eventemitter2'
import fse from 'fs-extra'
import httpsProxyAgent from 'https-proxy-agent'
import _, { debounce, sumBy } from 'lodash'
import lru from 'lru-cache'
import moment from 'moment'
import ms from 'ms'
import path from 'path'
import semver from 'semver'
import { LanguageSource, Logger, Health } from '../../typings'

import { setSimilarity, vocabNGram } from '../tools/strings'
import { isSpace, processUtteranceTokens, restoreOriginalUtteranceCasing } from '../tools/token-utils'
import { Gateway, LangServerInfo, LangsGateway, LanguageProvider, SeededLodashProvider } from '../typings'

const debug = DEBUG('nlu').sub('lang')

const MAX_PAYLOAD_SIZE = 150 * 1024 // 150kb
const JUNK_VOCAB_SIZE = 500
const JUNK_TOKEN_MIN = 1
const JUNK_TOKEN_MAX = 20

const VECTOR_FILE_PREFIX = 'lang_vectors'
const TOKEN_FILE_PREFIX = 'utterance_tokens'
const JUNK_FILE_PREFIX = 'junk_words'

class ManagedLRU<K, V> {
  public cache: lru<K, V>
  private _dumpDisabled: boolean = false

  constructor(
    private _cacheDir: string,
    private _filePrefix: string,
    private _versionHash: string,
    opts: lru.Options<K, V>,
    private _name: string = 'lru'
  ) {
    this.cache = new lru<K, V>(opts)
  }

  public get path() {
    return path.join(this._cacheDir, `${this._filePrefix}_${this._versionHash}.json`)
  }

  public async restore(process: (dump: any) => Promise<any> = d => d) {
    try {
      if (await fse.pathExists(this.path)) {
        const dump = await fse.readJSON(this.path)
        if (!dump) {
          return
        }
        this.cache.load(await process(dump))
      }
    } catch (err) {
      debug(`could not restore ${this._name} cache, error: %s`, err.message)
    }
  }

  public async dump() {
    try {
      await fse.ensureFile(this.path)
      await fse.writeJson(this.path, this.cache.dump())
      debug(`${this._name} cache updated at: %s`, this.path)
    } catch (err) {
      debug(`could not persist ${this._name} cache, error: %s`, err.message)
      this._dumpDisabled = true
    }
  }

  public async clearOldFiles() {
    const cacheExists = await fse.pathExists(this._cacheDir)
    if (!cacheExists) {
      return
    }

    const allCacheFiles = await fse.readdir(this._cacheDir)

    const fileStartWithPrefix = (fileName: string) => {
      return fileName.startsWith(this._filePrefix)
    }

    const fileEndsWithIncorrectHash = (fileName: string) => !fileName.includes(this._versionHash)

    const filesToDelete = allCacheFiles
      .filter(fileStartWithPrefix)
      .filter(fileEndsWithIncorrectHash)
      .map(f => path.join(this._cacheDir, f))

    for (const f of filesToDelete) {
      await fse.unlink(f)
    }
  }

  public persist = debounce(async () => {
    if (!this._dumpDisabled) {
      await this.dump()
    }
  }, ms('5s'))

  public get(key: K): V | undefined {
    return this.cache.get(key)
  }

  public set(key: K, value: V, maxAge?: number | undefined): boolean {
    return this.cache.set(key, value, maxAge)
  }
}

const createCaches = async (cacheDir: string, versionHash: string) => {
  const vectors = new ManagedLRU<string, Float32Array>(
    cacheDir,
    VECTOR_FILE_PREFIX,
    versionHash,
    {
      length: (arr: Float32Array) => {
        if (arr && arr.BYTES_PER_ELEMENT) {
          return arr.length * arr.BYTES_PER_ELEMENT
        } else {
          return 300 /* dim */ * Float32Array.BYTES_PER_ELEMENT
        }
      },
      max: 300 /* dim */ * Float32Array.BYTES_PER_ELEMENT /* bytes */ * 500000 /* tokens */
    },
    'vector'
  )

  await vectors.clearOldFiles()
  await vectors.restore()

  const tokens = new ManagedLRU<string, string[]>(
    cacheDir,
    TOKEN_FILE_PREFIX,
    versionHash,
    {
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
    },
    'tokens'
  )

  await tokens.clearOldFiles()
  await tokens.restore()

  const junkwords = new ManagedLRU<string[], string[]>(
    cacheDir,
    JUNK_FILE_PREFIX,
    versionHash,
    {
      length: (val: string[], key: string[]) => sumBy(key, x => x.length * 4) + sumBy(val, x => x.length * 4),
      max:
        4 * // bytes in strings
        10 * // token size
        500 * // vocab size
        1000 * // junk words
        10 // models
      // total is ~ 200 mb
    },
    'junkwords'
  )

  await junkwords.clearOldFiles()
  await junkwords.restore()

  return { vectors, tokens, junkwords }
}

class ServerConnection extends EventEmitter2 {
  private _ready: boolean = false
  public info?: LangServerInfo
  public client: AxiosInstance
  private _retryCount: number = 0
  private _intervalHandle?: NodeJS.Timeout

  constructor(private _source: LanguageSource) {
    super()
    this.client = axios.create(this._axiosConfig)
    this.on('error', this._stopRetry)
  }

  public get endpoint() {
    return this._source.endpoint
  }

  public get source() {
    return this._source
  }

  private get _axiosConfig(): AxiosRequestConfig {
    const headers: _.Dictionary<string> = {}

    if (this._source.authToken) {
      headers['authorization'] = `bearer ${this._source.authToken}`
    }

    const proxyConfig = process.PROXY ? { httpsAgent: new httpsProxyAgent(process.PROXY) } : {}

    return {
      baseURL: this._source.endpoint,
      headers,
      ...proxyConfig
    }
  }

  public async retry(): Promise<boolean> {
    const { data } = await this.client.get('/info')

    if (!data.ready) {
      this.info = undefined
      this._ready = false
      this.emit('retried', this._retryCount)
      return false
    }

    const version = semver.valid(semver.coerce(data.version))

    if (!version) {
      throw new Error('Lang server has an invalid version')
    }

    const info = {
      version: semver.clean(version),
      dim: data.dimentions,
      domain: data.domain
    }

    this.info = info
    this._ready = true
    this.emit('ready', info, data)

    return true
  }

  private _stopRetry() {
    if (this._intervalHandle) {
      clearInterval(this._intervalHandle)
    }
  }

  public connect(retryDelay: number = 5000, maxRetryCount = 15) {
    this._stopRetry()
    this._intervalHandle = setInterval(async () => {
      try {
        if (await this.retry()) {
          this._stopRetry()
        }
      } catch (err) {
        this.emit('error', err)
      } finally {
        this._retryCount++
        if (this._retryCount >= maxRetryCount) {
          this._stopRetry()
        }
      }
    }, retryDelay)
  }

  public isCompatibleWith(server: ServerConnection): boolean | undefined {
    if (!this.info || !server.info) {
      return undefined
    }
    return this.info.dim === server.info.dim
  }

  public get ready() {
    return this._ready
  }
}

export class RemoteLanguageProvider implements LanguageProvider {
  private _vectorsCache!: ManagedLRU<string, Float32Array>
  private _tokensCache!: ManagedLRU<string, string[]>
  private _junkwordsCache!: ManagedLRU<string[], string[]>
  private _validProvidersCount!: number
  private _languageDims!: number
  private _connections: { [endpoint: string]: ServerConnection } = {}
  private _nluVersion!: string
  private _langServerInfo!: LangServerInfo
  private _cacheInitialized: boolean = false

  private _seededLodashProvider!: SeededLodashProvider

  private langs: LangsGateway = {}

  get languages(): string[] {
    return Object.keys(this.langs)
  }

  private addProvider(lang: string, source: LanguageSource, client: AxiosInstance) {
    this.langs[lang] = [...(this.langs[lang] || []), { source, client, errors: 0, disabledUntil: undefined }]
    debug(`[${lang.toUpperCase()}] Language Provider added %o`, source)
  }

  async initialize(
    sources: LanguageSource[],
    logger: Logger,
    nluVersion: string,
    seededLodashProvider: SeededLodashProvider
  ): Promise<LanguageProvider> {
    this._nluVersion = nluVersion
    this._validProvidersCount = 0

    this._seededLodashProvider = seededLodashProvider
    this._connections = sources
      .map(s => new ServerConnection(s))
      .reduce((conns, conn: ServerConnection) => ({ ...conns, [conn.endpoint]: conn }), {})

    await Promise.mapSeries(Object.entries(this._connections), async ([endpoint, conn]) => {
      conn.on('error', async err => {
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

        this._connections[endpoint].connect()
      })

      conn.once('ready', async (info: LangServerInfo, data: any) => {
        const numIncompatible = Object.values(this._connections)
          .map(c => c.isCompatibleWith(conn))
          .filter(compatible => typeof compatible !== 'undefined' && !compatible).length

        if (numIncompatible > 0) {
          conn.emit('error', new Error('Language sources have different dimensions'))
          return
        }

        data.languages.forEach(x => this.addProvider(x.lang, conn.source, conn.client))

        const readyCount = Object.values(this._connections).filter(s => s.ready).length

        if (readyCount <= 1) {
          this._langServerInfo = info
          await this._initCache()
        }
      })
      conn.connect()
    })

    return this as LanguageProvider
  }
  public waitUntilReady(): Promise<void> {
    return new Promise(resolve => {
      if (this.ready) {
        resolve()
      }
      Object.values(this._connections).map(c =>
        c.once('ready', () => {
          if (this.ready) {
            resolve()
          }
        })
      )
    })
  }

  private async _initCache(): Promise<void> {
    if (!this._cacheInitialized) {
      const caches = await createCaches(path.join(process.APP_DATA_PATH, 'cache'), this.computeVersionHash())

      this._vectorsCache = caches.vectors
      this._tokensCache = caches.tokens
      this._junkwordsCache = caches.junkwords
      this._cacheInitialized = true
    }
  }

  public get ready() {
    return Object.values(this._connections).every(c => c.ready)
  }

  public get langServerInfo(): LangServerInfo {
    return this._langServerInfo
  }

  getHealth(): Partial<Health> {
    return {
      isReady: this.ready,
      validProvidersCount: this._validProvidersCount,
      validLanguages: Object.keys(this.langs)
    }
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

    this._junkwordsCache.cache.forEach((junk, vocab) => {
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
      await this._junkwordsCache.persist()
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
    const getCacheKey = (t: string) => `${lang}_${this._hash(t)}`

    tokens.forEach((token, i) => {
      if (isSpace(token)) {
        vectors[i] = new Float32Array(this._languageDims) // float 32 Arrays are initialized with 0s
      } else if (this._vectorsCache.cache.has(getCacheKey(token))) {
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

      await this._vectorsCache.persist()
    }

    return vectors
  }

  _hash(str: string): string {
    return crypto
      .createHash('md5')
      .update(str)
      .digest('hex')
  }

  async tokenize(utterances: string[], lang: string, vocab: string[] = []): Promise<string[][]> {
    if (!utterances.length) {
      return []
    }

    const getCacheKey = (t: string) => `${lang}_${this._hash(t)}`
    const tokenUtterances: string[][] = Array(utterances.length)
    const idxToFetch: number[] = [] // the utterances we need to fetch remotely

    utterances.forEach((utterance, idx) => {
      if (this._tokensCache.cache.has(getCacheKey(utterance))) {
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

      await this._tokensCache.persist()
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

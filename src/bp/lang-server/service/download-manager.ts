import axios from 'axios'
import fse from 'fs-extra'
import ms from 'ms'
import path from 'path'
import { URL } from 'url'

import ModelDownload from './model-download'

type ModelType = 'bpe' | 'embeddings'

const debug = DEBUG('download')

export interface DownloadableModel {
  type: ModelType
  remoteUrl: string
  language: string
  size: number
  dim?: number
  domain?: string
}

interface Language {
  code: string
  name: string
  flag: string
}

interface Meta {
  languages: {
    [code: string]: Language
  }
  bpe: {
    [code: string]: DownloadableModel
  }
  embeddings: DownloadableModel[]
}

export default class DownloadManager {
  public inProgress: ModelDownload[] = []
  public available: DownloadableModel[] = []

  private _refreshTimer?: NodeJS.Timeout
  private meta: Meta | undefined

  constructor(
    public readonly dim: number,
    public readonly domain: string,
    public readonly destDir: string,
    public readonly metaUrl: string
  ) {}

  async initialize() {
    fse.ensureDirSync(this.destDir)
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer)
    }
    this._refreshTimer = setInterval(() => this._refreshMeta(), ms('10m'))
    await this._refreshMeta()
  }

  private async _refreshMeta() {
    try {
      new URL(this.metaUrl)
      return this._refreshRemoteMeta()
    } catch (e) {
      debug('Fetching models locally', { url: this.metaUrl })
      return this._refreshLocalMeta()
    }
  }

  private async _refreshRemoteMeta() {
    try {
      const { data } = (await axios.get(this.metaUrl)) as { data: Meta }
      if (this._isValidMetadata(data)) {
        this.meta = data
      }
    } catch (err) {
      debug('Error fetching models', { url: this.metaUrl, message: err.message })
      throw err
    }
  }

  private _isValidMetadata(meta: Meta) {
    if (!meta) {
      debug('Not refreshing metadata, empty response')
      return false
    }
    if (!meta.languages || !Object.keys(meta.languages).length) {
      debug('Not refreshing metadata, missing languages')
      return false
    }
    if (!meta.embeddings || !Object.keys(meta.embeddings).length) {
      debug('Not refreshing metadata, missing embeddings')
      return false
    }

    return true
  }

  private async _refreshLocalMeta() {
    const filePath = path.isAbsolute(this.metaUrl) ? this.metaUrl : path.resolve(process.APP_DATA_PATH, this.metaUrl)
    try {
      const json = fse.readJSONSync(filePath)
      if (this._isValidMetadata(json)) {
        this.meta = json
      }
    } catch (err) {
      debug('Error reading metadata file', { file: filePath, message: err.message })
    }
  }

  get downloadableLanguages() {
    if (!this.meta) {
      throw new Error('Meta not initialized yet')
    }

    return this.meta.embeddings
      .filter(mod => mod.dim === this.dim && mod.domain === this.domain)
      .map(mod => {
        return {
          ...this.meta!.languages[mod.language],
          size: mod.size + this.meta!.bpe[mod.language].size
        }
      })
  }

  private _getEmbeddingModel(lang: string) {
    if (!this.meta) {
      throw new Error('Meta not initialized yet')
    }

    return this.meta.embeddings.find(mod => {
      return mod.dim === this.dim && mod.domain === this.domain && mod.language === lang
    })
  }

  cancelAndRemove(id: string) {
    const activeDownload = this.inProgress.find(x => x.id !== id)
    if (activeDownload && activeDownload.getStatus().status === 'downloading') {
      activeDownload.cancel()
    }

    this._remove(id)
  }

  private _remove(id: string) {
    this.inProgress = this.inProgress.filter(x => x.id !== id)
  }

  async download(lang: string) {
    if (!this.downloadableLanguages.find(l => lang === l.code)) {
      throw new Error(`Could not find model of dimention "${this.dim}" in domain "${this.domain}" for lang "${lang}"`)
    }

    const embedding = this._getEmbeddingModel(lang)
    const bpe = this.meta!.bpe[lang]

    const dl = new ModelDownload([bpe, embedding!], this.destDir)
    await dl.start(this._remove.bind(this, dl.id))
    this.inProgress.push(dl)

    return dl.id
  }
}

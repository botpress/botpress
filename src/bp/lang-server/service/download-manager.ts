import Axios from 'axios'
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
    this._refreshTimer = setInterval(() => this.refreshMeta(), ms('10m'))
    await this.refreshMeta()
  }

  async refreshMeta() {
    try {
      new URL(this.metaUrl)
      return this.refreshRemoteMeta()
    } catch (e) {
      debug('Fetching models locally', { url: this.metaUrl })
      return this.refreshLocalMeta()
    }
  }

  async refreshRemoteMeta() {
    try {
      const { data } = (await Axios.get(this.metaUrl)) as { data: Meta }
      this.meta = data
    } catch (err) {
      debug('Error fetching models', { url: this.metaUrl, message: err.message })
      throw err
    }
  }

  async refreshLocalMeta() {
    const filePath = path.isAbsolute(this.metaUrl) ? this.metaUrl : path.resolve(process.APP_DATA_PATH, this.metaUrl)
    try {
      const json = fse.readJSONSync(filePath)
      this.meta = json
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

  getEmbeddingModel(lang: string) {
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

    this.remove(id)
  }

  private remove(id: string) {
    this.inProgress = this.inProgress.filter(x => x.id !== id)
  }

  async download(lang: string) {
    if (!this.downloadableLanguages.find(l => lang === l.code)) {
      throw new Error(`Could not find model of dimention "${this.dim}" in domain "${this.domain}" for lang "${lang}"`)
    }

    const embedding = this.getEmbeddingModel(lang)
    const bpe = this.meta!.bpe[lang]

    const dl = new ModelDownload([bpe, embedding!], this.destDir)
    await dl.start(this.remove.bind(this, dl.id))
    this.inProgress.push(dl)

    return dl.id
  }
}

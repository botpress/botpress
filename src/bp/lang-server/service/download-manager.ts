import axios, { CancelTokenSource } from 'axios'
import fse from 'fs-extra'
import ms from 'ms'
import path from 'path'
import { Readable } from 'stream'
import { isArray } from 'util'

const debug = DEBUG('manager')

export type DownloadStatus = 'pending' | 'downloading' | 'loading' | 'errored' | 'done'

export class ModelDownload {
  public readonly tempPath: string
  public readonly finalPath: string
  public readonly id: string = Date.now().toString()

  public fileSize: number = 0
  public downloadedSize: number = 0

  private status: DownloadStatus = 'pending'
  private message: string = ''
  private readonly cancelToken: CancelTokenSource = axios.CancelToken.source()

  constructor(
    public readonly lang: string,
    public readonly remoteUrl: string,
    public readonly dim: number,
    public readonly domain: string,
    public readonly destDir: string
  ) {
    const fileName = `${domain}.${lang}.${dim}.bin`
    this.tempPath = path.resolve(destDir, fileName + '.tmp')
    this.finalPath = path.resolve(destDir, fileName)
  }

  async start() {
    if (this.status !== 'pending') {
      throw new Error("Can't restart download")
    }

    debug('starting download for ' + this.lang)

    const { data, headers } = await axios.get(this.remoteUrl, {
      responseType: 'stream',
      cancelToken: this.cancelToken.token
    })

    this.status = 'downloading'
    this.fileSize = parseInt(headers['content-length'])
    this.downloadedSize = 0

    const stream = data as Readable
    stream.pipe(fse.createWriteStream(this.tempPath))
    stream.on('error', err => {
      debug('model download failed', { lang: this.lang, error: err.message })
      this.status = 'errored'
      this.message = 'Error: ' + err.message
    })
    stream.on('data', chunk => (this.downloadedSize += chunk.length))
    stream.on('end', () => this._onFinishedDownloading())
  }

  async _onFinishedDownloading() {
    if (this.downloadedSize !== this.fileSize) {
      // Download is incomplete
      this.status = 'errored'
      this.message = 'Download incomplete or file is corrupted'
      return this._discardTemporaryFile()
    }

    try {
      await this._makeModelAvailable()
      this.status = 'done'
      this.message = ''
    } catch (err) {
      this.status = 'errored'
      this.message = 'Error moving downloaded model: ' + err.message
      this._discardTemporaryFile()
    }
  }

  private _discardTemporaryFile() {
    if (fse.existsSync(this.tempPath)) {
      fse.unlinkSync(this.tempPath)
    }
    debug(`deleting model %o`, { path: this.tempPath, lang: this.lang })
  }

  private async _makeModelAvailable() {
    if (fse.existsSync(this.finalPath)) {
      debug('removing existing model at %s', this.finalPath)
      fse.unlinkSync(this.finalPath)
    }

    try {
      await Promise.fromCallback(cb => fse.rename(this.tempPath, this.finalPath, cb))
    } catch (err) {
      debug('could not rename downloaded file %s', this.finalPath)
      await Promise.fromCallback(cb => fse.move(this.tempPath, this.finalPath, cb))
    }
  }

  cancel() {
    if (this.status === 'downloading') {
      this.cancelToken.cancel()
      this.status = 'errored'
      this.message = 'Cancelled'
    }
  }

  public getStatus(): { status: DownloadStatus; message: string } {
    return { status: this.status, message: this.message }
  }
}

export interface AvailableModel {
  remoteUrl: string
  lang: string
  dim: number
  domain: string
}

export default class DownloadManager {
  public inProgress: ModelDownload[] = []
  public available: AvailableModel[] = []

  private _refreshTimer?: NodeJS.Timeout

  constructor(
    public readonly dim: number,
    public readonly domain: string,
    public readonly destDir: string,
    public readonly metaUrl: string
  ) {}

  async init() {
    fse.ensureDirSync(this.destDir)
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer)
    }
    this._refreshTimer = setInterval(() => this.refreshMeta(), ms('10m'))
    await this.refreshMeta()
  }

  async refreshMeta() {
    try {
      const { data } = await axios.get(this.metaUrl)
      if (data && isArray(data)) {
        this.available = data
      }
    } catch (err) {
      debug('Error fecthing models', { url: this.metaUrl, message: err.message })
    }
  }

  cancelAndRemove(id: string) {
    const progress = this.inProgress.find(x => x.id !== id)
    if (progress && progress.getStatus().status === 'downloading') {
      progress.cancel()
    }

    this.inProgress = this.inProgress.filter(x => x.id !== id)
  }

  download(lang: string) {
    const model = this.available.find(x => x.lang === lang && x.dim === this.dim && x.domain === this.domain)
    if (!model) {
      throw new Error(`Could not find model of dimention "${this.dim}" in domain "${this.domain}" for lang "${lang}"`)
    }

    const dl = new ModelDownload(model.lang, model.remoteUrl, model.dim, model.domain, this.destDir)
    this.inProgress.push(dl)
    dl.start()
  }
}

import axios, { CancelTokenSource } from 'axios'
import fse from 'fs-extra'
import { Readable } from 'stream'

type ModelType = 'bpe' | 'embeddings'

export interface DownloadableModel {
  type: ModelType
  remoteUrl: string
  language: string
  size: number
  dim?: number
  domain?: string
}

const debug = DEBUG('download')

export type DownloadStatus = 'pending' | 'downloading' | 'loading' | 'errored' | 'done'

export default class ModelDownload {
  public readonly id: string = Date.now().toString()
  public readonly lang: string

  public downloadSizeProgress: number = 0
  private _doneCB = Function
  private status: DownloadStatus = 'pending'
  private message: string = ''
  private readonly cancelToken: CancelTokenSource = axios.CancelToken.source()

  constructor(private models: DownloadableModel[], public readonly destDir: string) {
    this.lang = models[0].language
  }

  private getFilePath(model: DownloadableModel): string {
    let fn = ''
    if (model.type === 'bpe') {
      fn = `bp.${model.language}.bpe.model`
    } else if (model.type === 'embeddings') {
      fn = `${model.domain}.${model.language}.${model.dim}.bin`
    }

    return `${this.destDir}/${fn}`
  }

  async start(done) {
    this._doneCB = done
    if (this.status !== 'pending') {
      throw new Error("Can't restart download")
    }

    if (this.models.length > 0) {
      this.status = 'downloading'
      await this._downloadNext()
    }
  }

  private async _downloadNext() {
    const modelToDownload = this.models.shift() as DownloadableModel
    debug(`Started to download ${modelToDownload.language} ${modelToDownload.type} model`)

    const { data, headers } = await axios.get(modelToDownload.remoteUrl, {
      responseType: 'stream',
      cancelToken: this.cancelToken.token
    })

    const filePath = this.getFilePath(modelToDownload)
    const tmpPath = filePath + '.tmp'
    const stream = data as Readable
    const fileSize = parseInt(headers['content-length'])
    let downloadedSize = 0

    stream.pipe(fse.createWriteStream(tmpPath))
    stream.on('error', err => {
      debug('model download failed', { lang: modelToDownload.language, error: err.message })
      this.status = 'errored'
      this.message = 'Error: ' + err.message
    })

    stream.on('data', chunk => {
      downloadedSize += chunk.length
      this.downloadSizeProgress += chunk.length
    })
    stream.on('end', () => this._onFinishedDownloading(modelToDownload, downloadedSize, fileSize))
  }

  async _onFinishedDownloading(downloadedModel: DownloadableModel, downloadSize: number, fileSize: number) {
    if (downloadSize !== fileSize) {
      // Download is incomplete
      this.status = 'errored'
      this.message = 'Download incomplete or file is corrupted'
      this.models = []
      return this._cleanupTmp(downloadedModel)
    }

    try {
      await this._makeModelAvailable(downloadedModel)
    } catch (err) {
      this.status = 'errored'
      this.message = 'Download incomplete or file is corrupted'
      this.models = []
      return this._cleanupTmp(downloadedModel)
    }

    if (this.models.length > 0) {
      await this._downloadNext()
    } else {
      this.status = 'done'
      this.message = ''
      this._doneCB && this._doneCB(this.id)
    }
  }

  private _cleanupTmp(model: DownloadableModel) {
    const tmpPath = `${this.getFilePath(model)}.tmp`
    if (fse.existsSync(tmpPath)) {
      fse.unlinkSync(tmpPath)
    }

    debug(`deleting model %o`, { path: tmpPath, type: model.type, lang: model.language })
  }

  private async _makeModelAvailable(model: DownloadableModel) {
    const filePath = this.getFilePath(model) as string
    const tmpPath = `${filePath}.tmp`
    if (fse.existsSync(filePath)) {
      debug('removing existing model at %s', filePath)
      fse.unlinkSync(filePath)
    }

    try {
      await Promise.fromCallback(cb => fse.rename(tmpPath, filePath, cb))
    } catch (err) {
      debug('could not rename downloaded file %s', filePath)
      await Promise.fromCallback(cb => fse.move(tmpPath, filePath, cb))
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

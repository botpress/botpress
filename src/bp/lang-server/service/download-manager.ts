import axios, { CancelTokenSource } from 'axios'
import ms from 'ms'
import path from 'path'

export type DownloadStatus = 'pending' | 'downloading' | 'loading' | 'errored' | 'done'

export class ModelDownload {
  public readonly tempPath: string
  public readonly finalPath: string
  public readonly id: string = Date.now().toString()

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

  start() {}
  cancel() {}

  public getStatus(): { status: DownloadStatus; message: string } {
    return { status: this.status, message: this.message }
  }
}

export default class DownloadManager {
  public inProgress: ModelDownload[] = []
  public available: string[] = []

  private _refreshTimer?: NodeJS.Timeout

  constructor(
    public readonly dim: number,
    public readonly domain: string,
    public readonly destDir: string,
    public readonly metaUrl: string
  ) {}

  async init() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer)
    }
    this._refreshTimer = setInterval(() => this.refreshMeta(), ms('10m'))
    await this.refreshMeta()
  }

  async refreshMeta() {
    const { data } = await axios.get(this.metaUrl)
    console.log('META ==> ', data)
  }

  cancelAndRemove(id: string) {
    const progress = this.inProgress.find(x => x.id !== id)
    if (progress && progress.getStatus().status === 'downloading') {
      progress.cancel()
    }

    this.inProgress = this.inProgress.filter(x => x.id !== id)
  }

  download(lang: string) {}
}

// import axios, { CancelTokenSource } from 'axios'
// import { database, Logger } from 'botpress/sdk'
// import { InstalledModels, LangEmbeddingsMetadata, LanguageModel } from 'core/config/botpress.config'
// import { ConfigProvider } from 'core/config/config-loader'
// import fse from 'fs-extra'
// import glob from 'glob'
// import { inject, injectable, tagged } from 'inversify'
// import _ from 'lodash'
// import path from 'path'
// import { Readable } from 'stream'

// import { TYPES } from '../types'

// const debug = DEBUG('modelService')

// export interface CurrentFile {
//   filename: string
//   tempLocation: string
//   fileSize?: number
//   downloaded: number
// }

// const DEFAULT_METADATA_URL = 'https://s3.amazonaws.com/botpress-binaries/tools/metadata2.json'

// @injectable()
// export class LangService {
//   private _modelsDirectory: string
//   private _metadata!: LangEmbeddingsMetadata
//   private _waitingQueue: LanguageModel[] = []
//   private _activeDownload: CurrentFile | undefined
//   private _cancelToken: CancelTokenSource

//   constructor(
//     @inject(TYPES.Logger)
//     @tagged('name', 'LangService')
//     private logger: Logger,
//     @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
//   ) {
//     const _dataFolder =
//       process.env.APPDATA ||
//       (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : process.env.HOME + '/.local/share')

//     this._cancelToken = axios.CancelToken.source()
//     this._modelsDirectory = path.resolve(process.PROJECT_LOCATION, 'models')
//     fse.ensureDirSync(this._modelsDirectory)
//   }

//   // Returns the list of all languages and if they are enabled or not
//   async getLanguages() {
//     const metadata = await this.getMetadata()
//     if (!metadata) {
//       return
//     }

//     const config = await this.configProvider.getBotpressConfig()
//     const installedModels = Object.keys(config.languageModels.installed)

//     return _.map(metadata.languages, (details, languageCode) => {
//       return { code: languageCode, enabled: installedModels.includes(languageCode), ...details }
//     })
//   }

//   getFolderSize() {
//     const files = fse.readdirSync(this._modelsDirectory)
//     const totalSize = _.sum(files.map(x => fse.statSync(path.resolve(this._modelsDirectory, x)).size))
//     return { location: this._modelsDirectory, totalSize }
//   }

//   async getMetadata(): Promise<LangEmbeddingsMetadata | undefined> {
//     console.log(this.getFolderSize())

//     if (this._metadata) {
//       return this._metadata
//     }

//     const metadata = await this._getRemoteMetadata()
//     if (metadata) {
//       fse.writeFileSync(path.resolve(this._modelsDirectory, 'metadata.json'), JSON.stringify(metadata, undefined, 2))
//       this._metadata = metadata
//       return metadata
//     } else {
//       return this._getLocalMetadata()
//     }
//   }

//   private async _getRemoteMetadata(): Promise<LangEmbeddingsMetadata | undefined> {
//     const config = await this.configProvider.getBotpressConfig()
//     const url = _.get(config, 'languageEmbeddings.metadataUrl', DEFAULT_METADATA_URL)
//     try {
//       const { data } = await axios.get(url)
//       return data
//     } catch (err) {
//       console.log('error reading remote metadata', err)
//     }
//   }

//   private async _getLocalMetadata() {
//     const local = process.env.MODEL_METADATA || path.resolve(this._modelsDirectory, 'metadata.json')
//     if (fse.existsSync(local)) {
//       return JSON.parse(fse.readFileSync('file.json', 'utf-8'))
//     }
//   }

//   async getInstalledModels(): Promise<string[]> {
//     const files = await Promise.fromCallback<string[]>(cb => glob('*.*', { cwd: this._modelsDirectory }, cb))
//     return files.map(f => path.basename(f))
//   }

//   async getActiveModels(): Promise<InstalledModels> {
//     const config = await this.configProvider.getBotpressConfig()
//     return config.languageModels.installed || {}
//   }

//   async downloadModel(filename: string) {
//     const model = await this._getModelDetails(filename)
//     if (!model) {
//       throw new Error(`Could not find model ${filename}`)
//     }

//     this._waitingQueue.push({ ...model, filename })
//     if (!this._activeDownload) {
//       // floating promise is intended
//       this._processDownload()
//     }
//   }

//   async cancelDownload(filename: string) {
//     if (this._activeDownload && this._activeDownload.filename === filename) {
//       this._cancelToken.cancel()
//     }

//     if (this._waitingQueue) {
//       this._waitingQueue = this._waitingQueue.filter(x => x.filename !== filename)
//     }
//   }

//   async deleteModel(filename: string) {
//     const fullPath = path.resolve(this._modelsDirectory, filename)
//     if (fse.existsSync(fullPath)) {
//       fse.unlinkSync(fullPath)
//     }
//     debug(`deleting model %o`, { fullPath, filename })
//   }

//   getStatus() {
//     return { activeDownload: this._activeDownload, waitingQueue: this._waitingQueue }
//   }

//   private async _getModelDetails(filename: string): Promise<LanguageModel | undefined> {
//     if (!this._metadata) {
//       await this.getMetadata()
//     }

//     return this._metadata.models[filename]
//   }

//   private async _processDownload() {
//     const model = this._waitingQueue.shift()
//     if (!model) {
//       return
//     }

//     const { data, headers } = await axios.get(model.location, {
//       responseType: 'stream',
//       cancelToken: this._cancelToken.token
//     })

//     this._activeDownload = {
//       filename: model.filename,
//       tempLocation: path.resolve(this._modelsDirectory, model.filename) + '_tmp',
//       fileSize: parseInt(headers['content-length']),
//       downloaded: 0
//     }

//     const stream = data as Readable
//     stream.pipe(fse.createWriteStream(this._activeDownload.tempLocation))
//     stream.on('data', chunk => {
//       this._activeDownload!.downloaded += chunk.length
//     })
//     stream.on('end', () => {
//       // floating promise intended
//       this._afterDownload()
//     })
//   }

//   private async _enableLanguage(filename: string) {
//     const model = await this._getModelDetails(filename)
//     // Update config
//     const { language, defaultEnv } = model!
//     const defaultEnv2 = 'production'
//     const config = await this.configProvider.getBotpressConfig()
//     console.log(config.languageModels)
//     await this.configProvider.mergeBotpressConfig({
//       languageModels: {
//         installed: {
//           [language]: {
//             [defaultEnv2]: filename
//           }
//         }
//       }
//     })
//     const config2 = await this.configProvider.getBotpressConfig()
//     console.log(config2.languageModels)
//     // console.log(model!.language)
//   }

//   private async _afterDownload() {
//     if (!this._activeDownload) {
//       return
//     }

//     const { filename, tempLocation, downloaded, fileSize } = this._activeDownload

//     try {
//       if (downloaded !== fileSize) {
//         debug(`download incomplete; cleaning up... %o`, this._activeDownload)
//         return fse.unlinkSync(tempLocation)
//       }

//       const finalDestination = path.resolve(this._modelsDirectory, filename)
//       if (fse.existsSync(finalDestination)) {
//         fse.unlinkSync(finalDestination)
//       }

//       await Promise.fromCallback(cb => fse.rename(tempLocation, finalDestination, cb))

//       this._enableLanguage(filename)
//     } catch (err) {
//       console.log(err)
//     } finally {
//       this._activeDownload = undefined
//       this._waitingQueue.length && this._processDownload()
//     }
//   }
// }

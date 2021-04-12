import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import * as NLUEngine from 'nlu/engine'
import modelIdService, { halfmd5 } from 'nlu/engine/model-id-service'
import path from 'path'
import Logger from 'simple-logger'
import { Stream } from 'stream'
import tar from 'tar'
import tmp from 'tmp'
import {
  Database,
  DBStorageDriver,
  DiskStorageDriver,
  GhostService,
  ScopedGhostService,
  MemoryObjectCache
} from './simple-ghost'

interface FSDriver {
  driver: 'fs'
}

interface DBDriver {
  driver: 'db'
  dbURL: string
}

export type ModelRepoOptions = FSDriver | DBDriver

interface ModelOwnershipOptions {
  appId: string
  appSecret: string
}

const MODELS_DIR = './models'
const MODELS_EXT = 'model'

const debug = DEBUG('nlu').sub('model-repo')

// TODO: add a customizable modelDir
const defaultOtpions: ModelRepoOptions = {
  driver: 'fs'
}

export class ModelRepository {
  private _ghost: GhostService
  private _db: Database
  private options: ModelRepoOptions

  constructor(private logger: Logger, options: Partial<ModelRepoOptions> = {}) {
    this.options = { ...defaultOtpions, ...options } as ModelRepoOptions

    this._db = new Database(logger)
    const diskDriver = new DiskStorageDriver()
    const dbdriver = new DBStorageDriver(this._db)
    const cache = new MemoryObjectCache()

    this._ghost = new GhostService(diskDriver, dbdriver, cache, logger)
  }

  async initialize() {
    debug('Model service initializing...')
    if (this.options.driver === 'db') {
      await this._db.initialize('postgres', this.options.dbURL)
    }
    await this._ghost.initialize(this.options.driver === 'db')
  }

  public async hasModel(modelId: NLUEngine.ModelId, options: ModelOwnershipOptions): Promise<boolean> {
    return !!(await this.getModel(modelId, options))
  }

  /**
   *
   * @param modelId The desired model id
   * @returns the corresponding model
   */
  public async getModel(
    modelId: NLUEngine.ModelId,
    options: ModelOwnershipOptions
  ): Promise<NLUEngine.Model | undefined> {
    const scopedGhost = this._getScopedGhostForAppID(options.appId)

    const stringId = modelIdService.toString(modelId)
    const fExtension = this._getFileExtension(options.appSecret)
    const fname = `${stringId}.${fExtension}`

    if (!(await scopedGhost.fileExists(MODELS_DIR, fname))) {
      return
    }
    const buffStream = new Stream.PassThrough()
    buffStream.end(await scopedGhost.readFileAsBuffer(MODELS_DIR, fname))
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })

    const tarStream = tar.x({ cwd: tmpDir.name, strict: true }, ['model']) as WriteStream
    buffStream.pipe(tarStream)
    await new Promise(resolve => tarStream.on('close', resolve))

    const modelBuff = await fse.readFile(path.join(tmpDir.name, 'model'))
    let mod
    try {
      mod = JSON.parse(modelBuff.toString())
    } catch (err) {
      await scopedGhost.deleteFile(MODELS_DIR, fname)
    } finally {
      tmpDir.removeCallback()
      return mod
    }
  }

  public async saveModel(model: NLUEngine.Model, options: ModelOwnershipOptions): Promise<void | void[]> {
    const serialized = JSON.stringify(model)

    const stringId = modelIdService.toString(model.id)
    const fExtension = this._getFileExtension(options.appSecret)
    const fname = `${stringId}.${fExtension}`

    const scopedGhost = this._getScopedGhostForAppID(options.appId)

    // TODO replace that logic with in-memory streams
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    const tmpFileName = path.join(tmpDir.name, 'model')
    await fse.writeFile(tmpFileName, serialized)
    const archiveName = path.join(tmpDir.name, fname)
    await tar.create(
      {
        file: archiveName,
        cwd: tmpDir.name,
        portable: true,
        gzip: true
      },
      ['model']
    )
    const buffer = await fse.readFile(archiveName)
    await scopedGhost.upsertFile(MODELS_DIR, fname, buffer)
    tmpDir.removeCallback()
  }

  public async listModels(options: ModelOwnershipOptions): Promise<NLUEngine.ModelId[]> {
    const scopedGhost = this._getScopedGhostForAppID(options.appId)

    const fextension = this._getFileExtension(options.appSecret)
    const files = await scopedGhost.directoryListing(MODELS_DIR, `*.${fextension}`)

    const modelIds = files
      .map(f => f.substring(0, f.lastIndexOf(`.${fextension}`)))
      .filter(stringId => modelIdService.isId(stringId))
      .map(stringId => modelIdService.fromString(stringId))

    return modelIds
  }

  // TODO: make this one more optimal
  public async pruneModels(options: ModelOwnershipOptions) {
    const models = await this.listModels(options)
    return Promise.each(models, m => this.deleteModel(m, options))
  }

  public async deleteModel(modelId: NLUEngine.ModelId, options: ModelOwnershipOptions): Promise<void> {
    const scopedGhost = this._getScopedGhostForAppID(options.appId)

    const stringId = modelIdService.toString(modelId)
    const fExtension = this._getFileExtension(options.appSecret)
    const fname = `${stringId}.${fExtension}`

    return scopedGhost.deleteFile(MODELS_DIR, fname)
  }

  private _getScopedGhostForAppID(appId: string): ScopedGhostService {
    return appId ? this._ghost.forBot(appId) : this._ghost.root()
  }

  private _getFileExtension(appSecret: string) {
    const secretHash = this._computeSecretHash(appSecret)
    return `${secretHash}.${MODELS_EXT}`
  }

  private _computeSecretHash(appSecret: string): string {
    return halfmd5(appSecret) // makes shorter file name than full regular md5
  }
}

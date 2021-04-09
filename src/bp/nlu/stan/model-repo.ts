import crypto from 'crypto'
import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import * as NLUEngine from 'nlu/engine'
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

export type ModelRepoOptions = (FSDriver | DBDriver) & {
  modelDir: string
}

interface ModelOwnershipOptions {
  appId?: string
  appSecret?: string
}

const MODELS_DIR = './models'
const debug = DEBUG('nlu').sub('model-repo')
const defaultOtpions: ModelRepoOptions = {
  modelDir: path.join(process.cwd(), 'botpress-nlu'),
  driver: 'fs'
}

export class ModelRepository {
  private _ghost: GhostService
  private _db: Database
  private options: ModelRepoOptions

  constructor(options: Partial<ModelRepoOptions>) {
    this.options = { ...defaultOtpions, ...options } as ModelRepoOptions
    const logger = new Logger('ModelRepo')
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
    options: ModelOwnershipOptions = {}
  ): Promise<NLUEngine.Model | undefined> {
    const scopedGhost = this._getScopedGhostForAppID(options.appId)
    const fname = this._makeFileName(modelId, options.appSecret)

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

  public async saveModel(model: NLUEngine.Model, options: ModelOwnershipOptions = {}): Promise<void | void[]> {
    const serialized = JSON.stringify(model)
    const modelName = this._makeFileName(model.id, options.appSecret)
    const scopedGhost = this._getScopedGhostForAppID(options.appId)

    // TODO replace that logic with in-memory streams
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    const tmpFileName = path.join(tmpDir.name, 'model')
    await fse.writeFile(tmpFileName, serialized)
    const archiveName = path.join(tmpDir.name, modelName)
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
    await scopedGhost.upsertFile(MODELS_DIR, modelName, buffer)
    tmpDir.removeCallback()
  }

  // // implement this properly
  // is this going top be publicly acessible over http ?

  // currently hard to achieve a secure list model,
  // we can't assure that the models are properly salted with the appSecret
  // in other words, anyone could list models corresponding to an appId without having the secret

  // potential solution
  // we could come up with a signature that is created by a combination of appID+appSecret that is appended at the end of the model id
  // this way we could validate the combination straight from the ghost using the file ending pattern
  public async listModels(options: ModelOwnershipOptions) {
    if (!options.appId) {
      throw Error('cannot list models without owner')
    }
    throw Error('not implemented')
  }

  // probably same here, prune models for a given appId appSecret can't be tested now
  // we could if we had a appID+appSecret signature appended
  public async pruneModels(options: ModelOwnershipOptions) {
    if (!options.appId) {
      throw Error('cannot prune models without owner')
    }
    throw Error('not implemented')
  }

  public async deleteModel(modelId: NLUEngine.ModelId, options: ModelOwnershipOptions = {}): Promise<void> {
    const scopedGhost = this._getScopedGhostForAppID(options.appId)
    const modelFileName = this._makeFileName(modelId, options.appSecret)

    return scopedGhost.deleteFile(MODELS_DIR, modelFileName)
  }

  private _getScopedGhostForAppID(appId: string = ''): ScopedGhostService {
    return appId ? this._ghost.forBot(appId) : this._ghost.root()
  }

  private _makeFileName(modelId: NLUEngine.ModelId, appSecret: string = ''): string {
    const stringId = NLUEngine.modelIdService.toString(modelId)
    const fname = crypto
      .createHash('md5')
      .update(`${stringId}${appSecret}`)
      .digest('hex')

    return `${fname}.model`
  }
}

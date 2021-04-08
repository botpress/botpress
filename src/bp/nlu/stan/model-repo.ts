import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import * as NLUEngine from 'nlu/engine'
import path from 'path'
import { Stream } from 'stream'
import tar from 'tar'
import tmp from 'tmp'

export const MODELS_DIR = './models'
export const MODEL_EXTENSION = 'model'

export interface PruningOptions {
  toKeep: number
}

export interface ListingOptions {
  negateFilter: boolean
}

const debug = DEBUG('nlu').sub('modelRepo')

const DEFAULT_PRUNING_OPTIONS: PruningOptions = {
  toKeep: 0
}

const DEFAULT_LISTING_OPTIONS: ListingOptions = {
  negateFilter: false
}

export default class ModelRepository {
  constructor(private modelDir: string) {}

  public async init() {
    mkdirp.sync(this.modelDir)
  }

  public async getModel(modelId: NLUEngine.ModelId, password: string): Promise<NLUEngine.Model | undefined> {
    const modelFileName = this._makeFileName(modelId, password)

    const { modelDir } = this

    const fpath = path.join(modelDir, modelFileName)
    if (!fse.existsSync(fpath)) {
      return
    }
    const buffStream = new Stream.PassThrough()
    buffStream.end(await fse.readFile(fpath))
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })

    const tarStream = tar.x({ cwd: tmpDir.name, strict: true }, ['model']) as WriteStream
    buffStream.pipe(tarStream)
    await new Promise(resolve => tarStream.on('close', resolve))

    const modelBuff = await fse.readFile(path.join(tmpDir.name, 'model'))
    let mod
    try {
      mod = JSON.parse(modelBuff.toString())
    } catch (err) {
      await fse.remove(fpath)
    } finally {
      tmpDir.removeCallback()
      return mod
    }
  }

  public async saveModel(model: NLUEngine.Model, password: string): Promise<void> {
    const { modelDir } = this
    const modelFileName = this._makeFileName(model.id, password)

    const serialized = JSON.stringify(model)

    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    const tmpFileName = path.join(tmpDir.name, 'model')
    await fse.writeFile(tmpFileName, serialized)

    const archiveName = path.join(tmpDir.name, modelFileName)
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
    const fpath = path.join(modelDir, modelFileName)
    await fse.writeFile(fpath, buffer)
    tmpDir.removeCallback()
  }

  private _makeFileName(modelId: NLUEngine.ModelId, password: string): string {
    const stringId = NLUEngine.modelIdService.toString(modelId)
    const fname = crypto
      .createHash('md5')
      .update(`${stringId}${password}`)
      .digest('hex')

    return `${fname}.model`
  }
}

//  YOU ARE AT MAKING A SINGLE MODEL REPO CLASS FROM THESE 2
// TODO support password
export class ScopedModelRepository {
  private _modelIdService: NLUEngine.ModelIdService

  constructor(private _ghost: sdk.ScopedGhostService) {
    this._modelIdService = NLUEngine.modelIdService
  }

  async initialize() {
    debug('Model service initializing...')

    // delete model files with invalid format
    const invalidModelFile = _.negate(this._modelIdService.isId)
    const invalidModels = (await this._listModels()).filter(invalidModelFile)

    if (!invalidModels.length) {
      return
    }

    debug(`About to prune the following files : [${invalidModels.join(', ')}] as they have an invalid format.`)

    await Promise.map(invalidModels, file => this._ghost.deleteFile(MODELS_DIR, this._makeFileName(file)))
  }

  public async hasModel(modelId: NLUEngine.ModelId): Promise<boolean> {
    return !!(await this.getModel(modelId))
  }

  /**
   *
   * @param modelId The desired model id
   * @returns the corresponding model
   */
  public async getModel(modelId: NLUEngine.ModelId): Promise<NLUEngine.Model | undefined> {
    const fname = this._makeFileName(this._modelIdService.toString(modelId))
    if (!(await this._ghost.fileExists(MODELS_DIR, fname))) {
      return
    }
    const buffStream = new Stream.PassThrough()
    buffStream.end(await this._ghost.readFileAsBuffer(MODELS_DIR, fname))
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })

    const tarStream = tar.x({ cwd: tmpDir.name, strict: true }, ['model']) as WriteStream
    buffStream.pipe(tarStream)
    await new Promise(resolve => tarStream.on('close', resolve))

    const modelBuff = await fse.readFile(path.join(tmpDir.name, 'model'))
    let mod
    try {
      mod = JSON.parse(modelBuff.toString())
    } catch (err) {
      await this._ghost.deleteFile(MODELS_DIR, fname)
    } finally {
      tmpDir.removeCallback()
      return mod
    }
  }

  /**
   *
   * @param query query filter
   * @returns the latest model that fits the query
   */
  public async getLatestModel(query: Partial<NLUEngine.ModelId>): Promise<NLUEngine.Model | undefined> {
    debug(`Searching for the latest model with characteristics ${JSON.stringify(query)}`)

    const availableModels = await this.listModels(query)
    if (availableModels.length === 0) {
      return
    }
    return this.getModel(availableModels[0])
  }

  public async saveModel(model: NLUEngine.Model): Promise<void | void[]> {
    const serialized = JSON.stringify(model)
    const modelName = this._makeFileName(this._modelIdService.toString(model.id))
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
    await this._ghost.upsertFile(MODELS_DIR, modelName, buffer)
    tmpDir.removeCallback()
  }

  public async listModels(
    query: Partial<NLUEngine.ModelId>,
    opt: Partial<ListingOptions> = {}
  ): Promise<NLUEngine.ModelId[]> {
    const options = { ...DEFAULT_LISTING_OPTIONS, ...opt }

    const allModelsFileName = await this._listModels()

    const baseFilter = (m: NLUEngine.ModelId) => _.isMatch(m, query)
    const filter = options.negateFilter ? _.negate(baseFilter) : baseFilter
    const validModels = allModelsFileName
      .filter(this._modelIdService.isId)
      .map(this._modelIdService.fromString)
      .filter(filter)

    return validModels
  }

  private _listModels = async (): Promise<string[]> => {
    const endingPattern = `*.${MODEL_EXTENSION}`
    const fileNames = await this._ghost.directoryListing(MODELS_DIR, endingPattern, undefined, undefined, {
      sortOrder: { column: 'modifiedOn', desc: true }
    })
    return fileNames.map(this._parseFileName)
  }

  public async pruneModels(models: NLUEngine.ModelId[], opt: Partial<PruningOptions> = {}): Promise<void | void[]> {
    const options = { ...DEFAULT_PRUNING_OPTIONS, ...opt }

    const modelsFileNames = models.map(this._modelIdService.toString).map(this._makeFileName)
    const toKeep = options.toKeep ?? 0
    if (modelsFileNames.length > toKeep) {
      const toPrune = modelsFileNames.slice(toKeep)
      const formatted = toPrune.join(', ')
      debug(
        `About to prune the following files : [${formatted}] as they are not the ${toKeep} newest with characteristics.`
      )
      return Promise.map(toPrune, file => this._ghost.deleteFile(MODELS_DIR, file))
    }
  }

  private _makeFileName(modelId: string): string {
    return `${modelId}.${MODEL_EXTENSION}`
  }

  private _parseFileName(fileName: string): string {
    return fileName.replace(`.${MODEL_EXTENSION}`, '')
  }
}

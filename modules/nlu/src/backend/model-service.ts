import * as sdk from 'botpress/sdk'
import { ModelIdService, ModelId, Model } from 'common/nlu/engine'
import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import { Stream } from 'stream'
import tar from 'tar'
import tmp from 'tmp'

export const MODELS_DIR = './models'
export const MODEL_EXTENSION = 'model'

const debug = DEBUG('nlu').sub('lifecycle')

interface PruningOptions {
  toKeep: number
}

interface ListingOptions {
  negateFilter: boolean
}

const DEFAULT_PRUNING_OPTIONS: PruningOptions = {
  toKeep: 0
}

const DEFAULT_LISTING_OPTIONS: ListingOptions = {
  negateFilter: false
}

export default class ModelService {
  constructor(
    private _modelIdService: ModelIdService,
    private _ghost: sdk.ScopedGhostService,
    private _botId: string
  ) {}

  async initialize() {
    debug.forBot(this._botId, 'Model service initializing...')

    // delete model files with invalid format
    const invalidModelFile = _.negate(this._modelIdService.isId)
    const invalidModels = (await this._listModels()).filter(invalidModelFile)

    if (!invalidModels.length) {
      return
    }

    debug.forBot(
      this._botId,
      `About to prune the following files : [${invalidModels.join(', ')}] as they have an invalid format.`
    )

    return Promise.map(invalidModels, file => this._ghost.deleteFile(MODELS_DIR, this._makeFileName(file)))
  }

  /**
   *
   * @param modelId The desired model id
   * @returns the corresponding model
   */
  public async getModel(modelId: ModelId): Promise<Model | undefined> {
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
  public async getLatestModel(query: Partial<ModelId>): Promise<Model | undefined> {
    debug.forBot(this._botId, `Searching for the latest model with characteristics ${JSON.stringify(query)}`)

    const availableModels = await this.listModels(query)
    if (availableModels.length === 0) {
      return
    }
    return this.getModel(availableModels[0])
  }

  public async saveModel(model: Model): Promise<void | void[]> {
    const serialized = JSON.stringify(model)
    const modelName = this._makeFileName(this._modelIdService.toString(model))
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

    const { languageCode } = model
    const modelsOfLang = await this.listModels({ languageCode })
    return this.pruneModels(modelsOfLang, { toKeep: 2 })
  }

  public async listModels(query: Partial<ModelId>, opt: Partial<ListingOptions> = {}): Promise<ModelId[]> {
    const options = { ...DEFAULT_LISTING_OPTIONS, ...opt }

    const allModelsFileName = await this._listModels()

    const baseFilter = (m: ModelId) => _.isMatch(m, query)
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

  public async pruneModels(models: ModelId[], opt: Partial<PruningOptions> = {}): Promise<void | void[]> {
    const options = { ...DEFAULT_PRUNING_OPTIONS, ...opt }

    const modelsFileNames = models.map(this._modelIdService.toString).map(this._makeFileName)
    const toKeep = options.toKeep ?? 0
    if (modelsFileNames.length > toKeep) {
      const toPrune = modelsFileNames.slice(toKeep)
      const formatted = toPrune.join(', ')
      debug.forBot(
        this._botId,
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

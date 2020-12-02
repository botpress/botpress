import * as sdk from 'botpress/sdk'
import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import { Stream } from 'stream'
import tar from 'tar'
import tmp from 'tmp'

export const MODELS_DIR = './models'
export const MODEL_EXTENSION = 'model'

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
  constructor(private _modelIdService: typeof sdk.NLU.modelId, private _ghost: sdk.ScopedGhostService) {}

  async initialize() {
    // delete model files with invalid format
    const invalidModelFile = _.negate(this._modelIdService.isId)
    const invalidModelsFiles = await this._listModels().filter(invalidModelFile)
    return Promise.map(invalidModelsFiles, file => this._ghost.deleteFile(MODELS_DIR, file))
  }

  /**
   *
   * @param modelId The desired model id
   * @returns the corresponding model
   */
  public async getModel(modelId: sdk.NLU.ModelId): Promise<sdk.NLU.Model | undefined> {
    const fname = this.makeFileName(modelId)
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
  public async getLatestModel(query: Partial<sdk.NLU.ModelId>): Promise<sdk.NLU.Model | undefined> {
    const availableModels = await this.listModels(query)
    if (availableModels.length === 0) {
      return
    }
    return this.getModel(availableModels[0])
  }

  public async saveModel(model: sdk.NLU.Model): Promise<void | void[]> {
    const serialized = JSON.stringify(model)
    const modelName = this.makeFileName(model)
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

  public async listModels(
    query: Partial<sdk.NLU.ModelId>,
    opt: Partial<ListingOptions> = {}
  ): Promise<sdk.NLU.ModelId[]> {
    const options = { ...DEFAULT_LISTING_OPTIONS, ...opt }

    const allModelsFileName = await this._listModels()

    const baseFilter = (m: sdk.NLU.ModelId) => _.isMatch(m, query)
    const filter = options.negateFilter ? _.negate(baseFilter) : baseFilter
    const validModels = allModelsFileName
      .filter(this._modelIdService.isId)
      .map(this.parseFileName)
      .filter(filter)

    return validModels
  }

  private _listModels = (): Promise<string[]> => {
    const endingPattern = `*.${MODEL_EXTENSION}`
    return this._ghost.directoryListing(MODELS_DIR, endingPattern, undefined, undefined, {
      sortOrder: { column: 'modifiedOn', desc: true }
    })
  }

  public async pruneModels(models: sdk.NLU.ModelId[], opt: Partial<PruningOptions> = {}): Promise<void | void[]> {
    const options = { ...DEFAULT_PRUNING_OPTIONS, ...opt }

    const modelsFileNames = models.map(this.makeFileName)
    const toKeep = options.toKeep ?? 0
    if (modelsFileNames.length > toKeep) {
      return Promise.map(modelsFileNames.slice(toKeep), file => this._ghost.deleteFile(MODELS_DIR, file))
    }
  }

  private makeFileName(modelId: sdk.NLU.ModelId): string {
    const stringId = this._modelIdService.toString(modelId)
    return `${stringId}.${MODEL_EXTENSION}`
  }

  private parseFileName(fileName: string): sdk.NLU.ModelId {
    const stringId = fileName.replace(`.${MODEL_EXTENSION}`, '')
    return this._modelIdService.fromString(stringId)
  }
}

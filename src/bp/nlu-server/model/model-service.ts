import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import LRUCache from 'lru-cache'

import ModelRepository from './model-repo'

export default class ModelService {
  private _modelRepo: ModelRepository

  /**
   * Acording to wikipedia (https://en.wikipedia.org/wiki/UTF-8),
   * UTF-8 characters can have a size varying from 1 to 4 bytes.
   * We want to allow about ~500Mb of models in Memory.
   * Assuming each character has an average size of 2 bytes,
   * the total number of characters allowed is 250M or 250,000,000 chars.
   * - FL
   *
   * TODO: this size should maybe be settable by CLI.
   */
  private _modelCache = new LRUCache<string, NLU.Model>({
    max: 250000000,
    length: model => model.data.input.length + model.data.output.length
  })

  constructor(modelDir: string) {
    this._modelRepo = new ModelRepository(modelDir)
  }

  public async init() {
    return this._modelRepo.init()
  }

  public async getModel(modelId: string, password: string): Promise<NLU.Model | undefined> {
    const modelFileName = this._modelRepo.makeFileName(modelId, password)
    const cached = this._modelCache.get(modelFileName)
    if (cached) {
      return cached
    }

    const model = await this._modelRepo.getModel(modelFileName)
    if (model) {
      this._modelCache.set(modelFileName, model)
    }

    return model
  }

  public async saveModel(model: NLU.Model, modelId: string, password: string): Promise<void> {
    const modelFileName = this._modelRepo.makeFileName(modelId, password)
    this._modelCache.set(modelFileName, model)
    return this._modelRepo.saveModel(model, modelFileName)
  }

  public makeModelId(hash: string, languageCode: string, seed: number) {
    return `${hash}.${languageCode}.${seed}`
  }
}

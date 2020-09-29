import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import LRUCache from 'lru-cache'

import ModelRepository from './model-repo'

export default class ModelService {
  private _modelRepo: ModelRepository
  private _modelCache = new LRUCache<string, NLU.Model>({
    max: 500000000,
    length: model => model.data.input.length + model.data.output.length
  }) // allow about 500 Mb of models in cache

  constructor(modelDir: string) {
    this._modelRepo = new ModelRepository(modelDir)
  }

  public async init() {
    return this._modelRepo.init()
  }

  public async getModel(modelFileName: string): Promise<NLU.Model | undefined> {
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

  public async saveModel(model: NLU.Model, modelFileName: string): Promise<void> {
    this._modelCache.set(modelFileName, model)
    return this._modelRepo.saveModel(model, modelFileName)
  }

  public makeModelId(hash: string, languageCode: string, seed: number) {
    return `${hash}.${languageCode}.${seed}`
  }

  public makeFileName(modelId: string, password: string): string {
    return this._modelRepo.makeFileName(modelId, password)
  }
}

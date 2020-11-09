import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import Engine from 'nlu-core/engine'

import ModelRepository from './model-repo'

export default class ModelService {
  private _modelRepo: ModelRepository

  constructor(modelDir: string, private engine: Engine) {
    this._modelRepo = new ModelRepository(modelDir)
  }

  public async init() {
    return this._modelRepo.init()
  }

  public async getModel(modelId: string, password: string): Promise<NLU.Model | undefined> {
    return this._modelRepo.getModel(modelId, password)
  }

  public async saveModel(model: NLU.Model, modelId: string, password: string): Promise<void> {
    return this._modelRepo.saveModel(model, modelId, password)
  }

  public makeModelId(
    intents: NLU.IntentDefinition[],
    entities: NLU.EntityDefinition[],
    languageCode: string,
    seed: number
  ) {
    const hash = this.engine.computeModelHash(intents, entities, languageCode)
    return `${hash}.${seed}`
  }
}

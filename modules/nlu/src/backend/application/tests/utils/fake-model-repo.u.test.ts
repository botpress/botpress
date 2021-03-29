import * as NLUEngine from './sdk.u.test'
import _ from 'lodash'

import { IModelRepository, ListingOptions, PruningOptions } from '../../scoped/infrastructure/model-repository'

import './sdk.u.test'
import { areEqual } from './utils.u.test'

const _satisfies = (id: NLUEngine.ModelId, query: Partial<NLUEngine.ModelId>): boolean => {
  return !Object.entries(query).some(([prop, value]) => id[prop] !== value)
}

const DEFAULT_PRUNING_OPTIONS: PruningOptions = {
  toKeep: 0
}

const DEFAULT_LISTING_OPTIONS: ListingOptions = {
  negateFilter: false
}

export class FakeModelRepo implements IModelRepository {
  private _models: NLUEngine.Model[]

  constructor(modelsOnFs: NLUEngine.Model[] = []) {
    this._models = [...modelsOnFs]
  }

  async initialize(): Promise<void> {}

  async hasModel(modelId: NLUEngine.ModelId): Promise<boolean> {
    return !!this._models.find(mod => areEqual(mod, modelId))
  }

  async getModel(modelId: NLUEngine.ModelId): Promise<NLUEngine.Model | undefined> {
    return this._models.find(mod => areEqual(mod, modelId))
  }

  private _getIdx(modelId: NLUEngine.ModelId): number {
    return this._models.findIndex(mod => areEqual(mod, modelId))
  }

  async getLatestModel(query: Partial<NLUEngine.ModelId>): Promise<NLUEngine.Model | undefined> {
    const models = this._models.filter(mod => _satisfies(mod, query))
    const idx = models.map(model => ({ model, idx: this._getIdx(model) })).filter(x => x.idx >= 0)
    return _.minBy(idx, i => i.idx)?.model
  }

  async saveModel(model: NLUEngine.Model): Promise<void | void[]> {
    this._models.unshift(model) // newest => ... => oldest
  }

  async listModels(
    query: Partial<NLUEngine.ModelId>,
    opt?: Partial<ListingOptions> | undefined
  ): Promise<NLUEngine.ModelId[]> {
    const options = { ...DEFAULT_LISTING_OPTIONS, ...opt }
    const { negateFilter } = options
    const baseFilter = (mod: NLUEngine.ModelId) => _satisfies(mod, query)
    const filter = negateFilter ? _.negate(baseFilter) : baseFilter
    return this._models.filter(filter)
  }

  async pruneModels(modelIds: NLUEngine.ModelId[], opt?: Partial<PruningOptions> | undefined): Promise<void | void[]> {
    const options = { ...DEFAULT_PRUNING_OPTIONS, ...opt }
    const { toKeep } = options

    const modelsIdx = modelIds
      .map(id => this._getIdx(id))
      .filter(idx => idx >= 0)
      .sort()

    const trash = modelsIdx.slice(toKeep).map(idx => this._models[idx])
    trash.forEach(this._remove)
  }

  private _remove = (modelId: NLUEngine.ModelId) => {
    const idx = this._getIdx(modelId)
    if (idx >= 0) {
      this._models.splice(idx, 1)
    }
  }
}

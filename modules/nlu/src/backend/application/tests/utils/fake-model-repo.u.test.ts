import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { ListingOptions, ModelRepository, PruningOptions } from '../../scoped/typings'

import { areEqual } from './utils.u.test'

const _satisfies = (id: NLU.ModelId, query: Partial<NLU.ModelId>): boolean => {
  return !Object.entries(query).some(([prop, value]) => id[prop] !== value)
}

const DEFAULT_PRUNING_OPTIONS: PruningOptions = {
  toKeep: 0
}

const DEFAULT_LISTING_OPTIONS: ListingOptions = {
  negateFilter: false
}

export class FakeModelRepo implements ModelRepository {
  constructor() {}

  private _models: NLU.Model[] = []

  async initialize(): Promise<void> {}

  async hasModel(modelId: NLU.ModelId): Promise<boolean> {
    return !!this._models.find(mod => areEqual(mod, modelId))
  }

  async getModel(modelId: NLU.ModelId): Promise<NLU.Model | undefined> {
    return this._models.find(mod => areEqual(mod, modelId))
  }

  private _getIdx(modelId: NLU.ModelId): number {
    return this._models.findIndex(mod => areEqual(mod, modelId))
  }

  async getLatestModel(query: Partial<NLU.ModelId>): Promise<NLU.Model | undefined> {
    const models = this._models.filter(mod => _satisfies(mod, query))
    const idx = models.map(model => ({ model, idx: this._getIdx(model) })).filter(x => x.idx >= 0)
    return _.minBy(idx, i => i.idx)?.model
  }

  async saveModel(model: NLU.Model): Promise<void | void[]> {
    this._models.unshift(model) // newest => ... => oldest
  }

  async listModels(query: Partial<NLU.ModelId>, opt?: Partial<ListingOptions> | undefined): Promise<NLU.ModelId[]> {
    const options = { ...DEFAULT_LISTING_OPTIONS, ...opt }
    const { negateFilter } = options
    const baseFilter = (mod: NLU.ModelId) => _satisfies(mod, query)
    const filter = negateFilter ? _.negate(baseFilter) : baseFilter
    return this._models.filter(filter)
  }

  async pruneModels(modelIds: NLU.ModelId[], opt?: Partial<PruningOptions> | undefined): Promise<void | void[]> {
    const options = { ...DEFAULT_PRUNING_OPTIONS, ...opt }
    const { toKeep } = options

    const modelsIdx = modelIds
      .map(id => this._getIdx(id))
      .filter(idx => idx >= 0)
      .sort()

    const trash = modelsIdx.slice(toKeep).map(idx => this._models[idx])
    trash.forEach(this._remove)
  }

  private _remove = (modelId: NLU.ModelId) => {
    const idx = this._getIdx(modelId)
    if (idx >= 0) {
      this._models.splice(idx, 1)
    }
  }
}

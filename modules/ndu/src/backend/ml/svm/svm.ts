import assert from 'assert'
import _ from 'lodash'
import numeric from 'numeric'

import BaseSVM from './addon'
import { checkConfig, defaultConfig } from './configuration'
import gridSearch from './grid-search'
import { GridSearchResult } from './grid-search/typings'
import { normalizeDataset, normalizeInput } from './normalize'
import reduce from './reduce-dataset'
import { Data, Report, SvmConfig, SvmModel } from './typings'

class TrainingCanceledError extends Error {
  constructor(msg: string) {
    super(msg)
  }
}

interface TrainOutput {
  model: SvmModel
  report?: Report
}

export class SVM {
  private _config: SvmConfig
  private _baseSvm: BaseSVM | undefined
  private _retainedVariance: number = 0
  private _retainedDimension: number = 0
  private _initialDimension: number = 0
  private _isCanceled: boolean = false

  constructor(config: Partial<SvmConfig>) {
    this._config = { ...checkConfig(defaultConfig(config)) }
  }

  async initialize(model: SvmModel) {
    const self = this
    this._baseSvm = await BaseSVM.restore(model)
    Object.entries(model.param).forEach(([key, val]) => {
      self._config[key] = val
    })
  }

  cancelTraining = () => {
    this._isCanceled = true
  }

  train = async (
    dataset: Data[],
    seed: number,
    progressCb: (progress: number) => void
  ): Promise<TrainOutput | undefined> => {
    const self = this
    const dims = numeric.dim(dataset)
    assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'dataset must be an list of [X,y] tuples')

    if (!this._config.normalize) {
      this._config.mu = Array(dims[2]).fill(0)
      this._config.sigma = Array(dims[2]).fill(0)
    } else {
      const norm = normalizeDataset(dataset)
      this._config.mu = norm.mu
      this._config.sigma = norm.sigma
      dataset = norm.dataset
    }

    if (!this._config.reduce) {
      this._config.u = numeric.identity(dims[2])
      this._retainedVariance = 1
      this._retainedDimension = dims[2]
      this._initialDimension = dims[2]
    } else {
      const red = reduce(dataset, this._config.retainedVariance)
      this._config.u = red.U
      this._retainedVariance = red.retainedVariance
      this._retainedDimension = red.newDimension
      this._initialDimension = red.oldDimension
      dataset = red.dataset
    }

    let gridSearchResult: GridSearchResult
    try {
      gridSearchResult = await gridSearch(dataset, this._config, seed, progress => {
        if (this._isCanceled) {
          throw new TrainingCanceledError('Training was canceled')
        }
        progressCb(progress.done / (progress.total + 1))
      })
    } catch (err) {
      if (err instanceof TrainingCanceledError) {
        return
      }
      throw err
    }

    const { params, report } = gridSearchResult
    self._baseSvm = new BaseSVM()
    return self._baseSvm.train(dataset, seed, params).then(function(model) {
      progressCb(1)
      const fullModel: SvmModel = { ...model, param: { ...self._config, ...model.param } }

      if (report) {
        const fullReport: Report = {
          ...report,
          reduce: self._config.reduce,
          retainedVariance: self._retainedVariance,
          retainedDimension: self._retainedDimension,
          initialDimension: self._initialDimension
        }
        return { model: fullModel, report: fullReport }
      }
      return { model: fullModel }
    })
  }

  isTrained = () => {
    return !!this._baseSvm ? this._baseSvm.isTrained() : false
  }

  predict = (x: number[]) => {
    assert(this.isTrained())
    return (this._baseSvm as BaseSVM).predict(this._format(x))
  }

  predictSync = (x: number[]) => {
    assert(this.isTrained())
    return (this._baseSvm as BaseSVM).predictSync(this._format(x))
  }

  predictProbabilities = (x: number[]) => {
    assert(this.isTrained())
    return (this._baseSvm as BaseSVM).predictProbabilities(this._format(x))
  }

  predictProbabilitiesSync = (x: number[]) => {
    assert(this.isTrained())
    return (this._baseSvm as BaseSVM).predictProbabilitiesSync(this._format(x))
  }

  private _format = (x: number[]) => {
    const mu = this._config.mu as number[]
    const sigma = this._config.sigma as number[]
    const u = this._config.u as number[][]
    const xNorm = normalizeInput(x, mu, sigma)
    return numeric.dot(xNorm, u) as number[]
  }
}

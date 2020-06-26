const assert = require('assert')

const _o = require('mout/object')

import numeric from 'numeric'
import Q from 'q'

import defaultConfig from './config'
import BaseSVM from './base-svm'
import gridSearch from './grid-search'
import svmTypes from './svm-types'

import classification from '../evaluators/classification'
import regression from '../evaluators/regression'
import normalizeDataset from '../util/normalize-dataset'
import normalizeInput from '../util/normalize-input'
import reduce from '../util/reduce-dataset'
import { SvmConfig, Data, SvmModel as Model, SvmModel } from '../typings'
import { configToAddonParams } from '../util/options-mapping'
import _ from 'lodash'

export class SVM {
  private _config: SvmConfig
  private _baseSvm: BaseSVM | undefined
  private _training: boolean = false
  private _retainedVariance: number = 0
  private _retainedDimension: number = 0
  private _initialDimension: number = 0

  constructor(config: Partial<SvmConfig>, model?: Model) {
    this._config = { ...defaultConfig(config) }
    if (model) {
      this._restore(model)
    }
  }

  private _restore = (model: Model) => {
    const self = this
    this._baseSvm = BaseSVM.restore(model)
    _o.forOwn(model.param, function(val, key) {
      self._config[key] = val
    })
  }

  train = (dataset: Data[]) => {
    const deferred = Q.defer()
    const self = this
    this._training = true
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

    // evaluate all possible combinations using grid-search and CV
    gridSearch(dataset, this._config)
      .progress(function(progress) {
        deferred.notify(progress.done / (progress.total + 1))
      })
      .spread(function(config: SvmConfig, report) {
        self._baseSvm = new BaseSVM()
        // train a new classifier using the entire dataset and the best config
        const param = configToAddonParams(config)
        return self._baseSvm.train(dataset, param).then(function(model) {
          deferred.notify(1)
          const fullModel: SvmModel = { ...model, param: _o.merge(self._config, model.param) }

          _o.mixIn(report, {
            reduce: self._config.reduce,
            retainedVariance: self._retainedVariance,
            retainedDimension: self._retainedDimension,
            initialDimension: self._initialDimension
          })
          deferred.resolve([fullModel, report])
        })
      })
      .fail(function(err) {
        throw err
      })
      .fin(function() {
        self._training = false
      })
    return deferred.promise
  }

  evaluate = (testset: Data[]) => {
    assert(this.isTrained(), 'train classifier first')
    const dims = numeric.dim(testset)
    assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'testset must be an list of [X,y] tuples')

    const self = this
    const predictions = _.map(testset, function(ex) {
      return [self.predictSync(ex[0]), ex[1]]
    })

    switch (this._config.svm_type) {
      case svmTypes.C_SVC:
      case svmTypes.NU_SVC:
      case svmTypes.ONE_CLASS:
        return classification.compute(predictions)
      case svmTypes.EPSILON_SVR:
      case svmTypes.NU_SVR:
        return regression.compute(predictions)
      default:
        throw new Error('not supported type: ' + this._config.svm_type)
    }
  }

  getKernelType = () => {
    return this._config.kernel_type
  }

  getSvmType = () => {
    return this._config.svm_type
  }

  normalize = () => {
    return this._config.normalize
  }

  reduce = () => {
    return this._config.reduce
  }

  isTrained = () => {
    return !!this._baseSvm ? this._baseSvm.isTrained() : false
  }

  isTraining = () => {
    return this._training
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
    return (this._baseSvm as BaseSVM).predictProbabilities(this._format(x)) // ici
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

'use strict'

var assert = require('assert')
var numeric = require('numeric')

import _ from 'lodash'
import svmTypes from './svm-types'
import kernelTypes from './kernel-types'
import addon, { Model, NSVM, Parameters } from '../addon'
import { Data } from '../typings'

class BaseSVM {
  private _clf: NSVM | undefined

  constructor(clf?: NSVM) {
    this._clf = clf
  }

  static restore = (model: Model) => {
    let clf = new addon.NSVM()
    try {
      clf.set_model(model)
    } catch (err) {
      console.log(model)
      throw err
    }
    return new BaseSVM(clf)
  }

  train = (dataset: Data[], config: Parameters): Promise<Model> => {
    var dims = numeric.dim(dataset)
    assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'dataset must be a list of [X,y] tuples')

    const params = _.mergeWith(
      {
        svm_type: svmTypes.C_SVC,
        kernel_type: kernelTypes.RBF,
        degree: 3,
        gamma: 1,
        r: 0,
        C: 1,
        nu: 0.5,
        eps: 0.1,
        cache_size: 100,
        coef0: 0.0,
        p: 0.0,
        nr_weight: 0,
        weight_label: [0, 0],
        weight: [0.0, 0.0],
        shrinking: 1,
        probability: 0
      } as Parameters,
      config || {},
      (a, b) => (b === null ? a : b)
    )

    this._clf = new addon.NSVM()

    const X = dataset.map(d => d[0])
    const y = dataset.map(d => d[1])

    return new Promise((resolve, reject) => {
      try {
        const svm = this._clf as NSVM
        svm.train({ ...params, mute: 1 }, X, y)
        resolve(svm.get_model())
      } catch (err) {
        reject(err)
      }
    })
  }

  predictSync = (inputs: number[]): number => {
    assert(!!this._clf, 'train classifier first')
    var dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')
    return (this._clf as NSVM).predict(inputs)
  }

  predict = (inputs: number[]): Promise<number> => {
    assert(!!this._clf, 'train classifier first')
    var dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')

    const svm = this._clf as NSVM
    return new Promise((resolve, reject) => {
      try {
        resolve(svm.predict(inputs))
      } catch (err) {
        reject(err)
      }
    })
  }

  /*
   WARNING : Seems not to work very well.
   see : http://stats.stackexchange.com/questions/64403/libsvm-probability-estimates-in-multi-class-problems
   */
  predictProbabilitiesSync = (inputs: number[]): number[] => {
    assert(!!this._clf, 'train classifier first')
    var dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')

    const svm = this._clf as NSVM
    return svm.predict_probability(inputs).probabilities
  }

  predictProbabilities = (inputs: number[]): Promise<number[]> => {
    assert(!!this._clf, 'train classifier first')
    var dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')

    const svm = this._clf as NSVM
    return new Promise((resolve, reject) => {
      try {
        const res = svm.predict_probability(inputs)
        resolve(res.probabilities)
      } catch (err) {
        reject(err)
      }
    })
  }

  isTrained = () => {
    return !!this._clf ? this._clf.is_trained() : false
  }
}

export default BaseSVM

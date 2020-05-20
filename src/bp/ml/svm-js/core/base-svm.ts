const assert = require('assert')
import numeric from 'numeric'

import _ from 'lodash'
import Q from 'q'
import addon, { NSVM, Parameters, Model } from '../addon'
import { Data, SvmModel } from '../typings'

class BaseSVM {
  private _clf: NSVM | undefined

  constructor(clf?: NSVM) {
    this._clf = clf
  }

  static restore = (model: SvmModel) => {
    const clf = new addon.NSVM()
    clf.set_model(model) // might throw
    return new BaseSVM(clf)
  }

  train = (dataset: Data[], params: Parameters) => {
    const dims = numeric.dim(dataset)
    assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'dataset must be a list of [X,y] tuples')

    this._clf = new addon.NSVM()

    const X = dataset.map(d => d[0])
    const y = dataset.map(d => d[1])

    const deferred = Q.defer<Model>()
    try {
      const svm = this._clf as NSVM
      svm.train({ ...params, mute: 1 }, X, y)
      deferred.resolve(svm.get_model())
    } catch (err) {
      deferred.reject(err)
    }

    return deferred.promise
  }

  predictSync = (inputs: number[]): number => {
    assert(!!this._clf, 'train classifier first')
    const dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')
    return (this._clf as NSVM).predict(inputs)
  }

  predict = (inputs: number[]): Q.Promise<number> => {
    assert(!!this._clf, 'train classifier first')
    const dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')

    const deferred = Q.defer<number>()

    const svm = this._clf as NSVM

    try {
      deferred.resolve(svm.predict(inputs))
    } catch (err) {
      deferred.reject(err)
    }

    return deferred.promise
  }

  /*
   WARNING : Seems not to work very well.
   see : http://stats.stackexchange.com/questions/64403/libsvm-probability-estimates-in-multi-class-problems
   */
  predictProbabilitiesSync = (inputs: number[]): number[] => {
    assert(!!this._clf, 'train classifier first')
    const dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')

    const svm = this._clf as NSVM
    return svm.predict_probability(inputs).probabilities
  }

  predictProbabilities = (inputs: number[]): Q.Promise<number[]> => {
    assert(!!this._clf, 'train classifier first')
    const dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')

    const deferred = Q.defer<number[]>()

    const svm = this._clf as NSVM

    try {
      const res = svm.predict_probability(inputs)
      deferred.resolve(res.probabilities)
    } catch (err) {
      deferred.reject(err)
    }

    return deferred.promise
  }

  isTrained = () => {
    return !!this._clf ? this._clf.is_trained() : false
  }
}

export default BaseSVM

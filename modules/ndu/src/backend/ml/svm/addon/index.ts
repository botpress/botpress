import { NSVM, makeSvm, Model, Parameters } from '@botpress/node-svm'
import assert from 'assert'
import _ from 'lodash'
import numeric from 'numeric'

import { Data } from '../typings'

export default class BaseSVM {
  private _clf: NSVM | undefined

  constructor(clf?: NSVM) {
    this._clf = clf
  }

  static restore = async (model: Model) => {
    const clf = await makeSvm()
    clf.set_model(model) // might throw
    return new BaseSVM(clf)
  }

  train = async (dataset: Data[], random_seed: number, params: Parameters): Promise<Model> => {
    const dims = numeric.dim(dataset)
    assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'dataset must be a list of [X,y] tuples')

    this._clf = await makeSvm({ random_seed })

    const X = dataset.map(d => d[0])
    const y = dataset.map(d => d[1])

    const svm = this._clf as NSVM
    return new Promise((resolve, reject) => {
      svm.train_async({ ...params, mute: 1 }, X, y, msg => {
        if (msg) {
          reject(new Error(msg))
        } else {
          resolve(svm.get_model())
        }
      })
    })
  }

  predictSync = (inputs: number[]): number => {
    assert(!!this._clf, 'train classifier first')
    const dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')
    return (this._clf as NSVM).predict(inputs)
  }

  predict = (inputs: number[]): Promise<number> => {
    assert(!!this._clf, 'train classifier first')
    const dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')

    const svm = this._clf as NSVM

    return new Promise((resolve, reject) => {
      try {
        svm.predict_async(inputs, resolve)
      } catch (err) {
        reject(err)
      }
    })
  }

  predictProbabilitiesSync = (inputs: number[]): number[] => {
    assert(!!this._clf, 'train classifier first')
    const dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')

    const svm = this._clf as NSVM
    return svm.predict_probability(inputs).probabilities
  }

  predictProbabilities = (inputs: number[]): Promise<number[]> => {
    assert(!!this._clf, 'train classifier first')
    const dims = numeric.dim(inputs)
    assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')

    const svm = this._clf as NSVM
    return new Promise((resolve, reject) => {
      try {
        svm.predict_probability_async(inputs, p => resolve(p.probabilities))
      } catch (err) {
        reject(err)
      }
    })
  }

  isTrained = () => {
    return !!this._clf ? this._clf.is_trained() : false
  }
}

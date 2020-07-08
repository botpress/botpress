import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Data, SvmModel, SvmParameters as Parameters } from './svm-js/typings'
import { SVM } from './svm-js/core/svm'
import svmTypes from './svm-js/core/svm-types'
import kernelTypes from './svm-js/core/kernel-types'
import { getMinKFold } from './svm-js/util/split-dataset'

export const DefaultTrainArgs: Partial<sdk.MLToolkit.SVM.SVMOptions> = {
  c: [0.1, 1, 2, 5, 10, 20, 100],
  classifier: 'C_SVC',
  gamma: [0.01, 0.1, 0.25, 0.5, 0.75],
  kernel: 'LINEAR',
  probability: true,
  reduce: false
}

type Serialized = SvmModel & {
  labels_idx: string[]
}

export class Trainer implements sdk.MLToolkit.SVM.Trainer {
  private clf: SVM | undefined
  private labels: string[] = []
  private model?: SvmModel
  private report?: any

  constructor() {}

  async train(
    points: sdk.MLToolkit.SVM.DataPoint[],
    options: Partial<sdk.MLToolkit.SVM.SVMOptions> = DefaultTrainArgs,
    callback?: sdk.MLToolkit.SVM.TrainProgressCallback | undefined
  ): Promise<string> {
    const args = { ...DefaultTrainArgs, ...options }

    if (args.classifier === 'ONE_CLASS') {
      args.probability = false // not supported
    }

    const vectorsLengths = _(points)
      .map(p => p.coordinates.length)
      .uniq()
      .value()
    if (vectorsLengths.length > 1) {
      throw new Error('All vectors must be of the same size')
    }

    this.labels = []
    const dataset: Data[] = points.map(c => [c.coordinates, this.getLabelIdx(c.label)])

    if (this.labels.length < 2) {
      throw new Error("SVM can't train on a dataset of only one class")
    }

    const minKFold = getMinKFold(dataset)
    const kFold = Math.max(minKFold, 4)

    this.clf = new SVM({
      svm_type: args.classifier ? svmTypes[args.classifier] : undefined,
      kernel_type: args.kernel ? kernelTypes[args.kernel] : undefined,
      C: args.c,
      gamma: args.gamma,
      probability: args.probability,
      reduce: args.reduce,
      kFold
    })

    await this._train(dataset, callback)
    return this.serialize()
  }

  private async _train(dataset: Data[], callback?: sdk.MLToolkit.SVM.TrainProgressCallback | undefined): Promise<any> {
    return new Promise((resolve, reject) => {
      const svm = this.clf as SVM
      svm
        .train(dataset)
        .progress(progress => {
          if (callback && typeof callback === 'function') {
            callback(progress)
          }
        })
        .spread((trainedModel, report) => {
          this.model = trainedModel
          this.report = report
          resolve()
        })
        .catch(err => reject(new Error(err)))
    })
  }

  private getLabelIdx(label: string) {
    const idx = this.labels.indexOf(label)
    if (idx === -1) {
      this.labels.push(label)
      return this.labels.indexOf(label)
    }
    return idx
  }

  isTrained(): boolean {
    return !!this.model
  }

  private serialize(): string {
    const model = this.model as SvmModel // model was trained
    const serialized: Serialized = { ...model, labels_idx: this.labels }
    return JSON.stringify(serialized)
  }
}

export class Predictor implements sdk.MLToolkit.SVM.Predictor {
  private clf: SVM | undefined
  private labels: string[]
  private parameters: Parameters | undefined

  constructor(json_model: string) {
    const serialized: Serialized = JSON.parse(json_model)
    this.labels = serialized.labels_idx

    try {
      // TODO: actually check the model format
      const model = _.omit(serialized, 'labels_idx')
      this.parameters = model.param
      this.clf = new SVM({ kFold: 1 }, model)
    } catch (err) {
      this.throwModelHasChanged(err)
    }
  }

  private throwModelHasChanged(err?: Error) {
    let errorMsg = 'SVM model format has changed. NLU needs to be retrained.'
    if (err) {
      errorMsg += ` Inner error is '${err}'.`
    }
    throw new Error(errorMsg)
  }

  private getLabelByIdx(idx): string {
    idx = Math.round(idx)
    if (idx < 0) {
      throw new Error(`Invalid prediction, prediction must be between 0 and ${this.labels.length}`)
    }

    return this.labels[idx]
  }

  async predict(coordinates: number[]): Promise<sdk.MLToolkit.SVM.Prediction[]> {
    if (this.parameters?.probability) {
      return this._predictProb(coordinates)
    } else {
      return await this._predictOne(coordinates)
    }
  }

  private async _predictProb(coordinates: number[]): Promise<sdk.MLToolkit.SVM.Prediction[]> {
    const results = await (this.clf as SVM).predictProbabilities(coordinates)
    const reducedResults = _.reduce(
      Object.keys(results),
      (acc, curr) => {
        const label = this.getLabelByIdx(curr).replace(/__k__\d+$/, '')
        acc[label] = (acc[label] || 0) + results[curr]
        return acc
      },
      {}
    )

    return _.orderBy(
      Object.keys(reducedResults).map(idx => ({ label: idx, confidence: reducedResults[idx] })),
      'confidence',
      'desc'
    )
  }

  private async _predictOne(coordinates: number[]): Promise<sdk.MLToolkit.SVM.Prediction[]> {
    // might simply use oneclass instead
    const results = await (this.clf as SVM).predict(coordinates)
    return [
      {
        label: this.getLabelByIdx(results),
        confidence: 0
      }
    ]
  }

  isLoaded(): boolean {
    return !!this.clf
  }

  getLabels(): string[] {
    return _.values(this.labels)
  }
}

import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { kernelTypes, svmTypes, SVM, restore } from './svm-js'
import { Data } from './svm-js/typings'

export const DefaultTrainArgs: Partial<sdk.MLToolkit.SVM.SVMOptions> = {
  c: [0.1, 1, 2, 5, 10, 20, 100],
  classifier: 'C_SVC',
  gamma: [0.01, 0.1, 0.25, 0.5, 0.75],
  kernel: 'LINEAR',
  probability: true,
  reduce: false
}

export class Trainer implements sdk.MLToolkit.SVM.Trainer {
  private clf: SVM | undefined
  private labels: string[] = []
  private model?: any
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

    this.clf = new SVM({
      svm_type: args.classifier ? svmTypes[args.classifier] : undefined,
      kernel_type: args.kernel ? kernelTypes[args.kernel] : undefined,
      C: args.c,
      gamma: args.gamma,
      probability: args.probability,
      reduce: args.reduce,
      kFold: 4
    })

    await this._train(points, callback)
    return this.serialize()
  }

  private async _train(
    points: sdk.MLToolkit.SVM.DataPoint[],
    callback?: sdk.MLToolkit.SVM.TrainProgressCallback | undefined
  ): Promise<any> {
    this.labels = []

    return new Promise((resolve, reject) => {
      const dataset: Data[] = points.map(c => [c.coordinates, this.getLabelIdx(c.label)])

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
    return JSON.stringify({ ...this.model, labels_idx: this.labels })
  }
}

export class Predictor implements sdk.MLToolkit.SVM.Predictor {
  private clf: SVM
  private labels: string[]
  private config: any

  constructor(model: string) {
    const options = JSON.parse(model)
    this.labels = options.labels_idx
    delete options.labels_idx

    // TODO: check the whole scheme and prepare a error handling
    if (!options.param) {
      throw new Error('params is absent from config type')
    }
    this.config = options.param
    this.clf = restore({ ...options, kFold: 1 })
  }

  private getLabelByIdx(idx): string {
    idx = Math.round(idx)
    if (idx < 0) {
      throw new Error(`Invalid prediction, prediction must be between 0 and ${this.labels.length}`)
    }

    return this.labels[idx]
  }

  async predict(coordinates: number[]): Promise<sdk.MLToolkit.SVM.Prediction[]> {
    if (this.config.probability) {
      return this._predictProb(coordinates)
    } else {
      return await this._predictOne(coordinates)
    }
  }

  private async _predictProb(coordinates: number[]): Promise<sdk.MLToolkit.SVM.Prediction[]> {
    const results = await this.clf.predictProbabilities(coordinates)
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
    const results = await this.clf.predict(coordinates)
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

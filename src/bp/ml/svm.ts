import * as sdk from 'botpress/sdk'
import _ from 'lodash'

const binding = require('./svm-js/index.js')

export const DefaultTrainArgs: Partial<sdk.MLToolkit.SVM.SVMOptions> = {
  c: [0.1, 1, 2, 5, 10, 20, 100],
  classifier: 'C_SVC',
  gamma: [0.01, 0.1, 0.25, 0.5, 0.75],
  kernel: 'LINEAR'
}

export class Trainer implements sdk.MLToolkit.SVM.Trainer {
  private clf: any
  private labels: string[] = []
  private model?: any
  private report?: any

  constructor(options: Partial<sdk.MLToolkit.SVM.SVMOptions> = DefaultTrainArgs) {
    const args = { ...DefaultTrainArgs, ...options }
    this.clf = new binding.SVM({
      svmType: args.classifier,
      kernelType: args.kernel,
      c: args.c,
      gamma: args.gamma,
      reduce: false,
      probability: true,
      kFold: 4
    })
  }

  async train(
    points: sdk.MLToolkit.SVM.DataPoint[],
    callback?: sdk.MLToolkit.SVM.TrainProgressCallback | undefined
  ): Promise<any> {
    this.labels = []

    return new Promise((resolve, reject) => {
      const dataset = points.map(c => [c.coordinates, this.getLabelIdx(c.label)])
      this.clf
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

  serialize(): string {
    return JSON.stringify({ ...this.model, labels_idx: this.labels }, undefined, 2)
  }
}

export class Predictor implements sdk.MLToolkit.SVM.Predictor {
  private clf: any
  private labels: string[]

  constructor(model: string) {
    const options = JSON.parse(model)
    this.labels = options.labels_idx
    delete options.labels_idx
    this.clf = binding.restore({ ...options, kFold: 1 })
  }

  private getLabelByIdx(idx): string {
    idx = Math.round(idx)
    if (idx < 0) {
      throw new Error(`Invalid prediction, prediction must be between 0 and ${this.labels.length}`)
    }

    return this.labels[idx]
  }

  async predict(coordinates: number[]): Promise<sdk.MLToolkit.SVM.Prediction[]> {
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

  isLoaded(): boolean {
    return !!this.clf
  }

  getLabels(): string[] {
    return _.values(this.labels)
  }
}

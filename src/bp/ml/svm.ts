import * as sdk from 'botpress/sdk'
import _ from 'lodash'

const binding = require('./svm-js/index.js')

export const DefaultTrainArgs: Partial<sdk.MLToolkit.SVM.SVMOptions> = {
  c: [0.01, 0.125, 0.5, 1, 2],
  classifier: 'C_SVC',
  gamma: [0.001, 0.01, 0.5],
  kernel: 'rbf'
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
      probability: true,
      kFold: 1
    })
  }

  train(
    points: sdk.MLToolkit.SVM.DataPoint[],
    callback?: sdk.MLToolkit.SVM.TrainProgressCallback | undefined
  ): Promise<void> {
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
        .catch(reject)
    })
  }

  private getLabelIdx(label: string) {
    const idx = this.labels.indexOf(label)
    if (idx === -1) {
      this.labels.push(label)
      return this.labels.length
    }
    return idx
  }

  isTrained(): boolean {
    return !!this.model
  }

  serialize(): string {
    return JSON.stringify(this.model, undefined, 2)
  }
}

export class Predictor implements sdk.MLToolkit.SVM.Predictor {
  private clf: any

  constructor(model: string) {
    const options = JSON.parse(model)
    this.clf = binding.restore({ ...options, kFold: 1 })
  }

  async predict(coordinates: number[]): Promise<sdk.MLToolkit.SVM.Prediction[]> {
    const results = await this.clf.predictProbabilities(coordinates)
    return _.orderBy(Object.keys(results).map(x => ({ label: x, confidence: results[x] })), 'confidence', 'desc')
  }

  isLoaded(): boolean {
    return this.clf
  }

  getLabels(): string[] {
    throw new Error('Method not implemented.')
  }
}

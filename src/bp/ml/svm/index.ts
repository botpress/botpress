import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Data, SvmModel, SvmParameters as Parameters, SvmTypes, KernelTypes } from './typings'
import { SVM } from './svm'
import { getMinKFold } from './grid-search/split-dataset'

type Serialized = SvmModel & {
  labels_idx: string[]
}

export class Trainer implements sdk.MLToolkit.SVM.Trainer {
  private model?: SvmModel

  constructor() {}

  async train(
    points: sdk.MLToolkit.SVM.DataPoint[],
    options?: Partial<sdk.MLToolkit.SVM.SVMOptions>,
    callback?: sdk.MLToolkit.SVM.TrainProgressCallback | undefined
  ): Promise<string> {
    const vectorsLengths = _(points)
      .map(p => p.coordinates.length)
      .uniq()
      .value()
    if (vectorsLengths.length > 1) {
      throw new Error('All vectors must be of the same size')
    }

    const labels = _(points)
      .map(p => p.label)
      .uniq()
      .value()
    const dataset: Data[] = points.map(p => [p.coordinates, labels.indexOf(p.label)])

    if (labels.length < 2) {
      throw new Error("SVM can't train on a dataset of only one class")
    }

    const minKFold = getMinKFold(dataset)
    const kFold = Math.max(minKFold, 4)

    const arr = (n: number | number[]) => (_.isArray(n) ? n : [n])

    options = options ?? {}
    const svm = new SVM({
      svm_type: options.classifier ? SvmTypes[options.classifier] : undefined,
      kernel_type: options.kernel ? KernelTypes[options.kernel] : undefined,
      C: options.c ? arr(options.c) : undefined,
      gamma: options.gamma ? arr(options.gamma) : undefined,
      probability: options.probability,
      reduce: options.reduce,
      kFold
    })

    const { model: trainedModel } = await svm.train(dataset, progress => {
      if (callback && typeof callback === 'function') {
        callback(progress)
      }
    })
    this.model = trainedModel

    const serialized: Serialized = { ...trainedModel, labels_idx: labels }
    return JSON.stringify(serialized)
  }

  isTrained(): boolean {
    return !!this.model
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

import { MLToolkit } from 'botpress/sdk'
import _ from 'lodash'

export class FakeSvmTrainer implements MLToolkit.SVM.Trainer {
  private _isTrained = false
  constructor() {}
  async train(
    points: MLToolkit.SVM.DataPoint[],
    options?: MLToolkit.SVM.SVMOptions | undefined,
    callback?: MLToolkit.SVM.TrainProgressCallback | undefined
  ): Promise<string> {
    if (!points.length) {
      throw new Error('fake SVM needs datapoints')
    }
    this._isTrained = true
    callback?.(1)
    return _(points)
      .map(p => p.label)
      .uniq()
      .value()
      .join(',')
  }
  isTrained(): boolean {
    return this._isTrained
  }
}

export class FakeSvmPredictor implements MLToolkit.SVM.Predictor {
  constructor(private model: string) {}

  async predict(coordinates: number[]): Promise<MLToolkit.SVM.Prediction[]> {
    const labels = this.model.split(',')
    return labels.map(label => ({ label, confidence: 1 / labels.length }))
  }
  isLoaded(): boolean {
    return true
  }
  getLabels(): string[] {
    return this.model.split(',')
  }
}

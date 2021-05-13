export namespace MLToolkit {
  export namespace SVM {
    export interface SVMOptions {
      classifier: 'C_SVC' | 'NU_SVC' | 'ONE_CLASS' | 'EPSILON_SVR' | 'NU_SVR'
      kernel: 'LINEAR' | 'POLY' | 'RBF' | 'SIGMOID'
      seed: number
      c?: number | number[]
      gamma?: number | number[]
      probability?: boolean
      reduce?: boolean
    }

    export interface DataPoint {
      label: string
      coordinates: number[]
    }

    export interface Prediction {
      label: string
      confidence: number
    }

    export interface TrainProgressCallback {
      (progress: number): void
    }

    export class Trainer {
      constructor()
      train(points: DataPoint[], options?: SVMOptions, callback?: TrainProgressCallback): Promise<string>
      isTrained(): boolean
    }

    export class Predictor {
      constructor(model: string)
      initialize(): Promise<void>
      predict(coordinates: number[]): Promise<Prediction[]>
      isLoaded(): boolean
      getLabels(): string[]
    }
  }
}

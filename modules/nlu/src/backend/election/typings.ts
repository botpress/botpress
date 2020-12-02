import * as sdk from 'botpress/sdk'

export type PredictOutput = Omit<sdk.IO.EventUnderstanding, 'predictions'> & {
  predictions: sdk.NLU.Predictions
}

export const NONE_INTENT = 'none' // should extract in comon code

export type ValueOf<T> = T[keyof T]

import { Parameters, Model } from './addon'

export interface SvmConfig {
  C?: number | number[]
  gamma?: number | number[]
  kFold: number
  normalize: boolean
  color: boolean
  interactive: boolean
  degree?: number | number[]
  nu?: number | number[]
  svm_type: number
  kernel_type: number
  cache_size: number
  eps: number
  nr_weight: number
  weight_label: number[]
  weight: number[]
  p?: number | number[]
  shrinking: boolean
  probability: boolean
  coef0?: number | number[]
  reduce: boolean
  retainedVariance: number

  mu?: number[]
  sigma?: number[]
  u?: number[][]
}

export interface SvmModel extends Omit<Model, 'param'> {
  param: SvmParameters
}

export interface SvmParameters extends Parameters {
  kFold: number
  normalize: boolean
  color: boolean
  interactive: boolean
  reduce: boolean
  retainedVariance: number
  mu?: number[]
  sigma?: number[]
  u?: number[][]
}

export type Data = [number[], number]

export type Report = ClassificationReport | RegressionReport

export interface ClassificationReport {
  accuracy: number
  fscore: any
  recall: any
  precision: any
  class: any
  size: any
}

export interface RegressionReport {
  mse: any
  std: number
  mean: any
  size: any
}

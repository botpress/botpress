export interface Model {
  param: Parameters
  nr_class: number
  l: number
  SV: number[][]
  sv_coef: number[][]
  rho: number[]
  probA: number[]
  probB: number[]
  sv_indices: number[]
  label: number[]
  nSV: number[]
  free_sv: number
}

export type GridSearchParameters = 'C' | 'gamma' | 'degree' | 'nu' | 'p' | 'coef0'

export interface OtherParameters {
  svm_type: number
  kernel_type: number
  cache_size: number
  eps: number
  nr_weight: number
  weight_label: number[]
  weight: number[]
  shrinking: boolean
  probability: boolean
}

export type Parameters = Record<GridSearchParameters, number> & OtherParameters

interface LibConfig {
  kFold: number
  normalize: boolean
  reduce: boolean
  retainedVariance: number
  mu?: number[]
  sigma?: number[]
  u?: number[][]
}
export type SvmConfig = Record<GridSearchParameters, number[]> & OtherParameters & LibConfig

export type SvmModel = Model & {
  param: SvmParameters
}

export type SvmParameters = Parameters & LibConfig

export type Data = [number[], number]

export type Report = (ClassificationReport | RegressionReport) & Partial<ReductionReport>

export interface ReductionReport {
  reduce: boolean
  retainedVariance: number
  retainedDimension: number
  initialDimension: number
}

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

export enum SvmTypes {
  C_SVC = 0,
  NU_SVC = 1,
  ONE_CLASS = 2,
  EPSILON_SVR = 3,
  NU_SVR = 4
}

export enum KernelTypes {
  LINEAR = 0,
  POLY = 1,
  RBF = 2,
  SIGMOID = 3
}

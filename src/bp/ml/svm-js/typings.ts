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
  r?: number | number[]
  reduce: boolean
  retainedVariance: number

  mu?: number
  sigma?: number
  u?: number
}

export type Data = [number[], number]

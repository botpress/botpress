const addon = require('./node-svm.node')
export default addon as BindingType

type SvmCtor = new (args?: { random_seed: number }) => NSVM
type HelloWorld = () => string
interface BindingType {
  NSVM: SvmCtor
  hello: HelloWorld
}

export interface NSVM {
  train(params: AugmentedParameters, x: number[][], y: number[]): void
  train_async(params: AugmentedParameters, x: number[][], y: number[], cb: (e: null | string) => void): void
  predict(x: number[]): number
  predict_async(x: number[], cb: (p: number) => void): void
  predict_probability(x: number[]): ProbabilityResult
  predict_probability_async(x: number[], cb: (p: ProbabilityResult) => void): void
  set_model(model: Model): void
  get_model(): Model
  free_model(): void
  is_trained(): boolean
}

interface ProbabilityResult {
  prediction: number
  probabilities: number[]
}

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

interface AugmentedParameters extends Parameters {
  mute: number
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

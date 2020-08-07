import assert from 'assert'
import _ from 'lodash'

import { KernelTypes, SvmConfig, SvmParameters, SvmTypes } from './typings'

export function checkConfig(config: SvmConfig) {
  assert(config.kFold > 0, 'k-fold must be >= 1')

  if (config.svm_type === SvmTypes.ONE_CLASS) {
    config.probability = false // not supported
  }

  if (![SvmTypes.C_SVC, SvmTypes.EPSILON_SVR, SvmTypes.NU_SVR].includes(config.svm_type)) {
    config.C = []
  }

  if (![KernelTypes.POLY, KernelTypes.RBF, KernelTypes.SIGMOID].includes(config.kernel_type)) {
    config.gamma = []
  }

  if (config.svm_type !== SvmTypes.EPSILON_SVR) {
    config.p = []
  }

  if (![SvmTypes.NU_SVC, SvmTypes.ONE_CLASS, SvmTypes.NU_SVR].includes(config.svm_type)) {
    config.nu = []
  }

  if (config.kernel_type !== KernelTypes.POLY) {
    config.degree = []
  }

  if (![KernelTypes.POLY, KernelTypes.SIGMOID].includes(config.kernel_type)) {
    config.coef0 = []
  }

  return config
}

const defaultConf: SvmConfig = {
  kernel_type: KernelTypes.LINEAR,
  svm_type: SvmTypes.C_SVC,
  nr_weight: 0,
  weight_label: [],
  weight: [],
  degree: [2],
  gamma: [0.01, 0.1, 0.25, 0.5, 0.75], // not for linear svc
  coef0: [0.125, 0.5], // not for linear svc
  C: [0.1, 1, 2, 5, 10, 20, 100],
  nu: [0.01, 0.125, 0.5, 1], // not for linear svc
  p: [0.01, 0.125, 0.5, 1], // not for linear svc
  kFold: 4,
  normalize: true,
  reduce: false,
  retainedVariance: 0.99,
  eps: 1e-3,
  cache_size: 200,
  shrinking: true,
  probability: true
}

export function configMapper(config: SvmConfig): SvmParameters {
  const { degree, gamma, nu, C, p, coef0 } = config
  return {
    ...config,
    degree: degree[0],
    gamma: gamma[0],
    nu: nu[0],
    C: C[0],
    p: p[0],
    coef0: coef0[0]
  }
}

export function parametersMapper(params: SvmParameters): SvmConfig {
  const { degree, gamma, nu, C, p, coef0 } = params
  return {
    ...params,
    degree: [degree],
    gamma: [gamma],
    nu: [nu],
    C: [C],
    p: [p],
    coef0: [coef0]
  }
}

const isNullOrUndefined = (x: any) => _.isNull(x) || _.isUndefined(x)
export function defaultConfig(config: Partial<SvmConfig>): SvmConfig {
  config = _.omitBy(config, isNullOrUndefined)
  return { ...defaultConf, ...config }
}

export function defaultParameters(params: Partial<SvmParameters>): SvmParameters {
  params = _.omitBy(params, isNullOrUndefined)
  const defaultParams = configMapper(defaultConf)
  return { ...defaultParams, ...params }
}

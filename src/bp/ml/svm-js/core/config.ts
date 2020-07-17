import _ from 'lodash'
import assert from 'assert'

import { SvmConfig, SvmParameters } from '../typings'
import svmTypes from './svm-types'
import kernelTypes from './kernel-types'

export function checkConfig(config: SvmConfig) {
  assert(config.kFold > 0, 'k-fold must be >= 1')
  // parameter C used for C-SVC, epsilon-SVR, and nu-SVR
  if (_.isString(config.svm_type)) {
    config.svm_type = svmTypes[config.svm_type]
  }
  if (
    config.svm_type === svmTypes.C_SVC ||
    config.svm_type === svmTypes.EPSILON_SVR ||
    config.svm_type === svmTypes.NU_SVR
  ) {
    if (_.isNumber(config.C)) {
      config.C = [config.C as number]
    }
    assert(config.C && (config.C as number[]).length > 0, 'Require at least one value for C parameter')
  } else {
    config.C = []
  }

  if (_.isString(config.kernel_type)) {
    config.kernel_type = kernelTypes[config.kernel_type]
  }
  // parameter gamma used for POLY, RBF, and SIGMOID kernels
  if (
    config.kernel_type === kernelTypes.POLY ||
    config.kernel_type === kernelTypes.RBF ||
    config.kernel_type === kernelTypes.SIGMOID
  ) {
    if (_.isNumber(config.gamma)) {
      config.gamma = [config.gamma as number]
    }
    assert(config.gamma && (config.gamma as number[]).length > 0, 'Require at least one value for gamma parameter')
  } else {
    config.gamma = []
  }

  // parameter epsilon used for epsilon-SVR only
  if (config.svm_type === svmTypes.EPSILON_SVR) {
    if (_.isNumber(config.p)) {
      config.p = [config.p as number]
    }
    assert(config.p && (config.p as number[]).length > 0, 'Require at least one value for epsilon parameter')
  } else {
    config.p = []
  }

  // parameter nu used for nu-SVC, one-class SVM, and nu-SVR
  if (
    config.svm_type === svmTypes.NU_SVC ||
    config.svm_type === svmTypes.ONE_CLASS ||
    config.svm_type === svmTypes.NU_SVR
  ) {
    if (_.isNumber(config.nu)) {
      config.nu = [config.nu as number]
    }
    assert(config.nu && (config.nu as number[]).length > 0, 'Require at least one value for nu parameter')
  } else {
    config.nu = []
  }

  // parameter degree used only for POLY kernel
  if (config.kernel_type === kernelTypes.POLY) {
    if (_.isNumber(config.degree)) {
      config.degree = [config.degree as number]
    }
    assert(config.degree && (config.degree as number[]).length > 0, 'Require at least one value for degree parameter')
  } else {
    config.degree = []
  }

  // parameter r used for POLY kernel
  if (config.kernel_type === kernelTypes.POLY || config.kernel_type === kernelTypes.SIGMOID) {
    if (_.isNumber(config.coef0)) {
      config.coef0 = [config.coef0 as number]
    }
    assert(config.coef0 && (config.coef0 as number[]).length > 0, 'Require at least one value for r parameter')
  } else {
    config.coef0 = []
  }
  return config
}

const defaultConf: SvmConfig = {
  kernel_type: kernelTypes.LINEAR,
  svm_type: svmTypes.C_SVC,
  nr_weight: 0,
  weight_label: [],
  weight: [],

  degree: [2], // for POLY kernel
  gamma: [0.001, 0.01, 0.5], // for POLY, RBF and SIGMOID kernels
  coef0: [0.125, 0.5], // for POLY and SIGMOID kernels (coef0)

  // SVM specific parameters
  C: [1, 2], // cost for C_SVC, EPSILON_SVR and NU_SVR
  nu: [0.01, 0.125, 0.5, 1], // for NU_SVC, ONE_CLASS and NU_SVR
  p: [0.01, 0.125, 0.5, 1], // for EPSILON-SVR

  // training options
  kFold: 4, // k parameter for k-fold cross validation

  normalize: true, // whether to use mean normalization during data pre-processing

  reduce: false, // whether to use PCA to reduce dataset dimension during data pre-processing
  // (see http://en.wikipedia.org/wiki/Principal_component_analysis)
  retainedVariance: 0.99, // Define the acceptable impact on data integrity (if PCA activated)

  eps: 1e-3, // stopping criteria
  cache_size: 200, // cache size in MB
  shrinking: true, // whether to use the shrinking heuristics
  probability: false // whether to train a SVC or SVR model for probability estimates
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

export function defaultConfig(config: Partial<SvmConfig>): SvmConfig {
  return _.merge({}, defaultConf, config)
}

export function defaultParameters(params: Partial<SvmParameters>): SvmParameters {
  const defaultParams = configMapper(defaultConf)
  return _.merge({}, defaultParams, params)
}

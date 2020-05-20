import _ from 'lodash'

const _l = require('mout/lang')

const assert = require('assert')

import defaults from './default-config'
import svmTypes from './svm-types'
import kernelTypes from './kernel-types'
import { SvmConfig } from '../typings'

function checkConfig(config: SvmConfig) {
  assert(config.kFold > 0, 'k-fold must be >= 1')
  // parameter C used for C-SVC, epsilon-SVR, and nu-SVR
  if (_l.isString(config.svm_type)) {
    config.svm_type = svmTypes[config.svm_type]
  }
  if (
    config.svm_type === svmTypes.C_SVC ||
    config.svm_type === svmTypes.EPSILON_SVR ||
    config.svm_type === svmTypes.NU_SVR
  ) {
    if (_l.isNumber(config.C)) {
      config.C = [config.C as number]
    }
    assert(config.C && (config.C as number[]).length > 0, 'Require at least one value for C parameter')
  } else {
    config.C = []
  }

  if (_l.isString(config.kernel_type)) {
    config.kernel_type = kernelTypes[config.kernel_type]
  }
  // parameter gamma used for POLY, RBF, and SIGMOID kernels
  if (
    config.kernel_type === kernelTypes.POLY ||
    config.kernel_type === kernelTypes.RBF ||
    config.kernel_type === kernelTypes.SIGMOID
  ) {
    if (_l.isNumber(config.gamma)) {
      config.gamma = [config.gamma as number]
    }
    assert(config.gamma && (config.gamma as number[]).length > 0, 'Require at least one value for gamma parameter')
  } else {
    config.gamma = []
  }

  // parameter epsilon used for epsilon-SVR only
  if (config.svm_type === svmTypes.EPSILON_SVR) {
    if (_l.isNumber(config.p)) {
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
    if (_l.isNumber(config.nu)) {
      config.nu = [config.nu as number]
    }
    assert(config.nu && (config.nu as number[]).length > 0, 'Require at least one value for nu parameter')
  } else {
    config.nu = []
  }

  // parameter degree used only for POLY kernel
  if (config.kernel_type === kernelTypes.POLY) {
    if (_l.isNumber(config.degree)) {
      config.degree = [config.degree as number]
    }
    assert(config.degree && (config.degree as number[]).length > 0, 'Require at least one value for degree parameter')
  } else {
    config.degree = []
  }

  // parameter r used for POLY kernel
  if (config.kernel_type === kernelTypes.POLY || config.kernel_type === kernelTypes.SIGMOID) {
    if (_l.isNumber(config.r)) {
      config.r = [config.r as number]
    }
    assert(config.r && (config.r as number[]).length > 0, 'Require at least one value for r parameter')
  } else {
    config.r = []
  }
  return config
}

function defaultConfig(config: Partial<SvmConfig>): SvmConfig {
  return checkConfig(_.merge(defaults, config))
}

export default defaultConfig

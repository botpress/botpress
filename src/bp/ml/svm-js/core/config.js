'use strict'

var _o = require('mout/object')
var _l = require('mout/lang')

var assert = require('assert')

var defaults = require('./default-options')
var svmTypes = require('./svm-types')
var kernelTypes = require('./kernel-types')

function checkConfig(config) {
  assert(config.kFold > 0, 'k-fold must be >= 1')
  // parameter C used for C-SVC, epsilon-SVR, and nu-SVR
  if (_l.isString(config.svmType)) {
    config.svmType = svmTypes[config.svmType]
  }
  if (
    config.svmType === svmTypes.C_SVC ||
    config.svmType === svmTypes.EPSILON_SVR ||
    config.svmType === svmTypes.NU_SVR
  ) {
    if (_l.isNumber(config.c)) {
      config.c = [config.c]
    }
    assert(config.c && config.c.length > 0, 'Require at least one value for C parameter')
  } else {
    config.c = []
  }

  if (_l.isString(config.kernelType)) {
    config.kernelType = kernelTypes[config.kernelType]
  }
  // parameter gamma used for POLY, RBF, and SIGMOID kernels
  if (
    config.kernelType === kernelTypes.POLY ||
    config.kernelType === kernelTypes.RBF ||
    config.kernelType === kernelTypes.SIGMOID
  ) {
    if (_l.isNumber(config.gamma)) {
      config.gamma = [config.gamma]
    }
    assert(config.gamma && config.gamma.length > 0, 'Require at least one value for gamma parameter')
  } else {
    config.gamma = []
  }

  // parameter epsilon used for epsilon-SVR only
  if (config.svmType === svmTypes.EPSILON_SVR) {
    if (_l.isNumber(config.epsilon)) {
      config.epsilon = [config.epsilon]
    }
    assert(config.epsilon && config.epsilon.length > 0, 'Require at least one value for epsilon parameter')
  } else {
    config.epsilon = []
  }

  // parameter nu used for nu-SVC, one-class SVM, and nu-SVR
  if (
    config.svmType === svmTypes.NU_SVC ||
    config.svmType === svmTypes.ONE_CLASS ||
    config.svmType === svmTypes.NU_SVR
  ) {
    if (_l.isNumber(config.nu)) {
      config.nu = [config.nu]
    }
    assert(config.nu && config.nu.length > 0, 'Require at least one value for nu parameter')
  } else {
    config.nu = []
  }

  // parameter degree used only for POLY kernel
  if (config.kernelType === kernelTypes.POLY) {
    if (_l.isNumber(config.degree)) {
      config.degree = [config.degree]
    }
    assert(config.degree && config.degree.length > 0, 'Require at least one value for degree parameter')
  } else {
    config.degree = []
  }

  // parameter r used for POLY kernel
  if (config.kernelType === kernelTypes.POLY || config.kernelType === kernelTypes.SIGMOID) {
    if (_l.isNumber(config.r)) {
      config.r = [config.r]
    }
    assert(config.r && config.r.length > 0, 'Require at least one value for r parameter')
  } else {
    config.r = []
  }
  return config
}

function defaultConfig(config) {
  config = config || {}
  return checkConfig(_o.merge(defaults, config))
}

module.exports = defaultConfig

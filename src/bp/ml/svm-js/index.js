'use strict'

var util = require('util')
var svmTypes = require('./core/svm-types')
var kernelTypes = require('./core/kernel-types')
var defaultConfig = require('./core/config')

var SVM = require('./core/svm')

function CSVC(config, model) {
  config = config || {}
  config.svmType = svmTypes.C_SVC
  SVM.call(this, config, model)
}
util.inherits(CSVC, SVM)

function NuSVC(config, model) {
  config = config || {}
  config.svmType = svmTypes.NU_SVC
  SVM.call(this, config, model)
}
util.inherits(NuSVC, SVM)

function EpsilonSVR(config, model) {
  config = config || {}
  config.svmType = svmTypes.EPSILON_SVR
  SVM.call(this, config, model)
}
util.inherits(EpsilonSVR, SVM)

function NuSVR(config, model) {
  config = config || {}
  config.svmType = svmTypes.NU_SVR
  SVM.call(this, config, model)
}
util.inherits(NuSVR, SVM)

function OneClassSVM(config, model) {
  config = config || {}
  config.svmType = svmTypes.ONE_CLASS
  SVM.call(this, config, model)
}
util.inherits(OneClassSVM, SVM)

function restore(model) {
  var conf = defaultConfig({})
  return new SVM(conf, model)
}

module.exports = {
  svmTypes: svmTypes,
  kernelTypes: kernelTypes,

  // utils
  restore: restore,

  SVM: SVM,
  CSVC: CSVC,
  NuSVC: NuSVC,
  EpsilonSVR: EpsilonSVR,
  NuSVR: NuSVR,
  OneClassSVM: OneClassSVM
}

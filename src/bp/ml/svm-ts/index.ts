import _svmTypes from './core/svm-types'
import _kernelTypes from './core/kernel-types'
import defaultConfig from './core/config'
import _SVM from './core/svm'
import { SvmConfig } from './typings'

export const svmTypes = _svmTypes
export const kernelTypes = _kernelTypes
export const SVM = _SVM

export class CSVC extends _SVM {
  constructor(config: SvmConfig, model) {
    config = config || {}
    config.svm_type = _svmTypes.C_SVC
    super(config, model)
  }
}

export class NuSVC extends _SVM {
  constructor(config: SvmConfig, model) {
    config = config || {}
    config.svm_type = _svmTypes.NU_SVC
    super(config, model)
  }
}

export class EpsilonSVR extends _SVM {
  constructor(config: SvmConfig, model) {
    config = config || {}
    config.svm_type = _svmTypes.EPSILON_SVR
    super(config, model)
  }
}

export class NuSVR extends _SVM {
  constructor(config: SvmConfig, model) {
    config = config || {}
    config.svm_type = _svmTypes.NU_SVR
    super(config, model)
  }
}

export class OneClassSVM extends _SVM {
  constructor(config: SvmConfig, model) {
    config = config || {}
    config.svm_type = _svmTypes.ONE_CLASS
    super(config, model)
  }
}

export function restore(model) {
  const conf = defaultConfig()
  return new _SVM(conf, model)
}

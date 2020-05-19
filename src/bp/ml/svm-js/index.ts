import _svmTypes from './core/svm-types'
import _kernelTypes from './core/kernel-types'
import defaultConfig from './core/config'
import { SVM as _SVM } from './core/svm'
import { SvmConfig } from './typings'
import { Model } from './addon'

export const svmTypes = _svmTypes
export const kernelTypes = _kernelTypes

export class SVM extends _SVM {
  constructor(config: Partial<SvmConfig>, model?: Model) {
    super(config, model)
  }
}

export function restore(model: Model): _SVM {
  const conf = defaultConfig()
  return new _SVM(conf, model)
}

import svmTypes from '../core/svm-types'
import classification from './classification'
import regression from './regression'
import { SvmConfig } from '../typings'

export default {
  classification: classification,
  regression: regression,
  getDefault: function(config: SvmConfig) {
    switch (config.svm_type) {
      case svmTypes.C_SVC:
      case svmTypes.NU_SVC:
      case svmTypes.ONE_CLASS:
        return classification
      case svmTypes.EPSILON_SVR:
      case svmTypes.NU_SVR:
        return regression
      default:
        throw new Error('No evaluator found for given configuration')
    }
  }
}

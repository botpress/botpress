import types from './svm-types'
import kernels from './kernel-types'
import { SvmConfig } from '../typings'

export default {
  kernel_type: kernels.LINEAR,
  svm_type: types.C_SVC,
  coef0: 0,
  p: 0,

  nr_weight: 0,

  weight_label: [0], // TODO: lollll

  weight: [0], // TODO: lollll

  degree: [2], // for POLY kernel
  gamma: [0.001, 0.01, 0.5], // for POLY, RBF and SIGMOID kernels
  r: [0.125, 0.5], // for POLY and SIGMOID kernels

  // SVM specific parameters
  C: [1, 2], // cost for C_SVC, EPSILON_SVR and NU_SVR
  nu: [0.01, 0.125, 0.5, 1], // for NU_SVC, ONE_CLASS and NU_SVR
  epsilon: [0.01, 0.125, 0.5, 1], // for EPSILON-SVR

  // training options
  kFold: 4, // k parameter for k-fold cross validation

  normalize: true, // whether to use mean normalization during data pre-processing

  reduce: false, // whether to use PCA to reduce dataset dimension during data pre-processing
  // (see http://en.wikipedia.org/wiki/Principal_component_analysis)
  retainedVariance: 0.99, // Define the acceptable impact on data integrity (if PCA activated)

  eps: 1e-3, // stopping criteria
  cache_size: 200, // cache size in MB
  shrinking: true, // whether to use the shrinking heuristics
  probability: false, // whether to train a SVC or SVR model for probability estimates

  // cli
  color: true,
  interactive: true
} as SvmConfig

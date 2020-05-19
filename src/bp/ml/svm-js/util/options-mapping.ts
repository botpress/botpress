import { SvmConfig } from '../typings'
import { Parameters } from '../addon'
import _ from 'lodash'

export function configToAddonParams(config: SvmConfig): Parameters {
  const {
    cache_size,
    eps,
    kernel_type,
    nr_weight,
    degree,
    gamma,
    nu,
    C,
    p,
    r,
    probability,
    shrinking,
    svm_type,
    weight,
    weight_label
  } = config

  return {
    C: C ? getOnlyOrThrow(C) : defaults.C,
    cache_size,
    coef0: r ? getOnlyOrThrow(r) : defaults.coef0,
    degree: degree ? getOnlyOrThrow(degree) : defaults.degree,
    eps: eps ? getOnlyOrThrow(eps) : defaults.eps,
    gamma: gamma ? getOnlyOrThrow(gamma) : defaults.gamma,
    kernel_type,
    nr_weight,
    nu: nu ? getOnlyOrThrow(nu) : defaults.nu,
    p: p ? getOnlyOrThrow(p) : defaults.p,
    probability: probability ? 1 : 0,
    shrinking: shrinking ? 1 : 0,
    svm_type: svm_type,
    weight: weight,
    weight_label: weight_label
  }
}

function getOnlyOrThrow(x: number | number[]): number {
  if (Array.isArray(x)) {
    const xarr = x as number[]
    if (xarr.length == 1) {
      return xarr[0]
    } else {
      throw new Error('Node SVM Addon requires you to choose a config after doing a grid search')
    }
  }
  return x
}

const defaults = {
  svm_type: 0,
  kernel_type: 0,
  degree: 3,
  gamma: 0.5,
  coef0: 0.0,
  cache_size: 100,
  eps: 0.1,
  C: 1.0,
  nr_weight: 0,
  weight_label: [0, 0],
  weight: [0.0, 0.0],
  nu: 0.5,
  p: 0.0,
  shrinking: 1,
  probability: 1,
  mute: 1
} as Parameters

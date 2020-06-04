import { SvmConfig, SvmParameters } from '../typings'
import _ from 'lodash'

export function configToAddonParams(config: SvmConfig): SvmParameters {
  const { eps, degree, gamma, nu, C, p, coef0 } = config

  const chosen = {
    C: C ? getOnlyOrThrow(C) : 1.0,
    coef0: coef0 ? getOnlyOrThrow(coef0) : 0.0,
    degree: degree ? getOnlyOrThrow(degree) : 3,
    eps: eps ? getOnlyOrThrow(eps) : 0.1,
    gamma: gamma ? getOnlyOrThrow(gamma) : 0.5,
    nu: nu ? getOnlyOrThrow(nu) : 0.5,
    p: p ? getOnlyOrThrow(p) : 0.0
  }

  return _.merge(config, chosen)
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

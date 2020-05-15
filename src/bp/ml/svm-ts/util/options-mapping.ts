import { SvmConfig } from '../typings'
import { Parameters } from '../addon'

export function configToAddonParams(config: SvmConfig): Parameters {
  const { cache_size, coef0, eps, kernel_type, nr_weight } = config

  return {
    C: getOnlyOrThrow(config.C),
    cache_size,
    coef0,
    degree: getOnlyOrThrow(config.degree),
    eps,
    gamma: getOnlyOrThrow(config.gamma),
    kernel_type,
    nr_weight,
    nu: getOnlyOrThrow(config.nu),
    p: getOnlyOrThrow(config.p),
    probability: config.probability ? 1 : 0,
    shrinking: config.shrinking ? 1 : 0,
    svm_type: config.svm_type,
    weight: config.weight,
    weight_label: config.weight_label
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

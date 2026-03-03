import type { ZodBigIntCheck, ZodBigIntDef } from '../../typings'
import { primitiveToTypescriptValue as toTs } from '../common/utils'

export const generateBigIntChecks = (def: ZodBigIntDef): string => {
  const checks = def.checks
  if (checks.length === 0) {
    return ''
  }
  return checks.map(_generateBigIntCheck).join('')
}

const _generateBigIntCheck = (check: ZodBigIntCheck): string => {
  switch (check.kind) {
    case 'min':
      return `.min(${toTs(check.value)}, ${toTs(check.message)})`
    case 'max':
      return `.max(${toTs(check.value)}, ${toTs(check.message)})`
    case 'multipleOf':
      return `.multipleOf(${toTs(check.value)}, ${toTs(check.message)})`
    default:
      check satisfies never
      return ''
  }
}

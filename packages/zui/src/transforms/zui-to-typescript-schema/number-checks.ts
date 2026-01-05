import { primitiveToTypescriptValue as toTs } from '../common/utils'
import { ZodNumberCheck, ZodNumberDef } from '../../z/types/number'
import { util } from '../../z'

export const generateNumberChecks = (def: ZodNumberDef): string => {
  const checks = def.checks
  if (checks.length === 0) {
    return ''
  }
  return checks.map(_generateNumberCheck).join('')
}

const _generateNumberCheck = (check: ZodNumberCheck): string => {
  switch (check.kind) {
    case 'min':
      return `.min(${toTs(check.value)}, ${toTs(check.message)})`
    case 'max':
      return `.max(${toTs(check.value)}, ${toTs(check.message)})`
    case 'int':
      return `.int(${toTs(check.message)})`
    case 'multipleOf':
      return `.multipleOf(${toTs(check.value)}, ${toTs(check.message)})`
    case 'finite':
      return `.finite(${toTs(check.message)})`
    default:
      type _assertion = util.AssertNever<typeof check>
      return ''
  }
}

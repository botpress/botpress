import { primitiveToTypescriptValue as toTs } from '../common/utils'
import { ZodDateCheck, ZodDateDef } from '../../z/types/date'
import { util } from '../../z'

export const generateDateChecks = (def: ZodDateDef): string => {
  const checks = def.checks
  if (checks.length === 0) {
    return ''
  }
  return checks.map(_generateDateCheck).join('')
}

const _generateDateCheck = (check: ZodDateCheck): string => {
  switch (check.kind) {
    case 'min':
      const minDate = dateTs(check.value)
      return `.min(${minDate}, ${toTs(check.message)})`
    case 'max':
      const maxDate = dateTs(check.value)
      return `.max(${maxDate}, ${toTs(check.message)})`
    default:
      type _assertion = util.AssertNever<typeof check>
      return ''
  }
}

const dateTs = (d: number): string => {
  return `new Date(${d})`
}

import { primitiveToTypescriptValue as toTs, unknownToTypescriptValue } from '../common/utils'
import { ZodStringCheck, ZodStringDef } from '../../z/types/string'
import { util } from '../../z'

export const generateStringChecks = (def: ZodStringDef): string => {
  const checks = def.checks
  if (checks.length === 0) {
    return ''
  }
  return checks.map(_generateStringCheck).join('')
}

const _generateStringCheck = (check: ZodStringCheck): string => {
  switch (check.kind) {
    case 'min':
      return `.min(${toTs(check.value)}, ${toTs(check.message)})`
    case 'max':
      return `.max(${toTs(check.value)}, ${toTs(check.message)})`
    case 'length':
      return `.length(${toTs(check.value)}, ${toTs(check.message)})`
    case 'email':
      return `.email(${toTs(check.message)})`
    case 'url':
      return `.url(${toTs(check.message)})`
    case 'emoji':
      return `.emoji(${toTs(check.message)})`
    case 'uuid':
      return `.uuid(${toTs(check.message)})`
    case 'cuid':
      return `.cuid(${toTs(check.message)})`
    case 'cuid2':
      return `.cuid2(${toTs(check.message)})`
    case 'ulid':
      return `.ulid(${toTs(check.message)})`
    case 'includes':
      const includesOptions = unknownToTypescriptValue({ message: check.message, position: check.position })
      return `.includes(${toTs(check.value)}, ${includesOptions})`
    case 'startsWith':
      return `.startsWith(${toTs(check.value)}, ${toTs(check.message)})`
    case 'endsWith':
      return `.endsWith(${toTs(check.value)}, ${toTs(check.message)})`
    case 'regex':
      const tsRegex = String(check.regex)
      return `.regex(${tsRegex}, ${toTs(check.message)})`
    case 'trim':
      return `.trim()`
    case 'toLowerCase':
      return `.toLowerCase()`
    case 'toUpperCase':
      return `.toUpperCase()`
    case 'datetime':
      const datetimePrecision = check.precision === null ? undefined : check.precision
      const dateTimeOptions = unknownToTypescriptValue({
        message: check.message,
        precision: datetimePrecision,
        offset: check.offset,
      })
      return `.datetime(${dateTimeOptions})`
    case 'ip':
      const ipOptions = unknownToTypescriptValue({ message: check.message, version: check.version })
      return `.ip(${ipOptions})`
    default:
      type _assertion = util.AssertNever<typeof check>
      return ''
  }
}

import { primitiveToTypescriptValue as toTs } from '../common/utils'
import { ZodSetDef } from '../../z/types/set'
export const generateSetChecks = (def: ZodSetDef): string => {
  const checks: string[] = []
  if (def.minSize) {
    const { value, message } = def.minSize
    checks.push(`.min(${toTs(value)}, ${toTs(message)})`)
  }
  if (def.maxSize) {
    const { value, message } = def.maxSize
    checks.push(`.max(${toTs(value)}, ${toTs(message)})`)
  }
  return checks.join('')
}

import { zuiKey } from '../../../z/consts'
import type { ZuiExtensionObject } from '../../../z/typings'

export type JsonSchema7AnyType = {
  [zuiKey]?: ZuiExtensionObject
}

export function parseAnyDef(): JsonSchema7AnyType {
  return {}
}

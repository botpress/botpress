import { zuiKey } from '../../../consts'
import type { ZuiExtensionObject } from '../../../typings'

export type JsonSchema7AnyType = {
  [zuiKey]?: ZuiExtensionObject
}

export function parseAnyDef(): JsonSchema7AnyType {
  return {}
}

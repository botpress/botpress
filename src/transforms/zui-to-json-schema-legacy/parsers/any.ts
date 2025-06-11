import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'

export type JsonSchema7AnyType = {
  [zuiKey]?: ZuiExtensionObject
}

export function parseAnyDef(): JsonSchema7AnyType {
  return {}
}

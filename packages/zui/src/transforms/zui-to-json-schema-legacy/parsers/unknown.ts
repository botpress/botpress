import { zuiKey } from '../../../z/consts'
import type { ZuiExtensionObject } from '../../../z/typings'

export type JsonSchema7UnknownType = {
  [zuiKey]?: ZuiExtensionObject
}

export function parseUnknownDef(): JsonSchema7UnknownType {
  return {}
}

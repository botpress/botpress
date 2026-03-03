import { zuiKey } from '../../../consts'
import type { ZuiExtensionObject } from '../../../typings'

export type JsonSchema7UnknownType = {
  [zuiKey]?: ZuiExtensionObject
}

export function parseUnknownDef(): JsonSchema7UnknownType {
  return {}
}

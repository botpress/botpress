import { zuiKey } from '../../../z'
import { ZuiExtensionObject } from '../../../z'

export type JsonSchema7UnknownType = {
  [zuiKey]?: ZuiExtensionObject
}

export function parseUnknownDef(): JsonSchema7UnknownType {
  return {}
}

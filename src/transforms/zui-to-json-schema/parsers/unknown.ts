import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'

export type JsonSchema7UnknownType = {
  [zuiKey]?: ZuiExtensionObject
}

export function parseUnknownDef(): JsonSchema7UnknownType {
  return {}
}

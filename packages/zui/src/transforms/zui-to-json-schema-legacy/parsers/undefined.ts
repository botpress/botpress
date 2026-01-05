import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'

export type JsonSchema7UndefinedType = {
  not: {}
  [zuiKey]?: ZuiExtensionObject
}

export function parseUndefinedDef(): JsonSchema7UndefinedType {
  return {
    not: {},
  }
}

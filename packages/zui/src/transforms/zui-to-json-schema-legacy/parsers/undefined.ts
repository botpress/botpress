import { zuiKey } from '../../../consts'
import type { ZuiExtensionObject } from '../../../typings'

export type JsonSchema7UndefinedType = {
  not: {}
  [zuiKey]?: ZuiExtensionObject
}

export function parseUndefinedDef(): JsonSchema7UndefinedType {
  return {
    not: {},
  }
}

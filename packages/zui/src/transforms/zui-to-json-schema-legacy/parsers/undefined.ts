import { zuiKey } from '../../../z/consts'
import type { ZuiExtensionObject } from '../../../z/typings'

export type JsonSchema7UndefinedType = {
  not: {}
  [zuiKey]?: ZuiExtensionObject
}

export function parseUndefinedDef(): JsonSchema7UndefinedType {
  return {
    not: {},
  }
}

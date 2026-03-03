import { zuiKey } from '../../../z/consts'
import type { ZuiExtensionObject } from '../../../z/typings'

export type JsonSchema7NeverType = {
  not: {}
  [zuiKey]?: ZuiExtensionObject
}

export function parseNeverDef(): JsonSchema7NeverType {
  return {
    not: {},
  }
}

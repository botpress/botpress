import { zuiKey } from '../../../consts'
import type { ZuiExtensionObject } from '../../../typings'

export type JsonSchema7NeverType = {
  not: {}
  [zuiKey]?: ZuiExtensionObject
}

export function parseNeverDef(): JsonSchema7NeverType {
  return {
    not: {},
  }
}

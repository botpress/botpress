import { zuiKey, ZuiExtensionObject } from '../../../z'

export type JsonSchema7NeverType = {
  not: {}
  [zuiKey]?: ZuiExtensionObject
}

export function parseNeverDef(): JsonSchema7NeverType {
  return {
    not: {},
  }
}

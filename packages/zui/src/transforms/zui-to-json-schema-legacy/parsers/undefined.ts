import { zuiKey, ZuiExtensionObject } from '../../../z'

export type JsonSchema7UndefinedType = {
  not: {}
  [zuiKey]?: ZuiExtensionObject
}

export function parseUndefinedDef(): JsonSchema7UndefinedType {
  return {
    not: {},
  }
}

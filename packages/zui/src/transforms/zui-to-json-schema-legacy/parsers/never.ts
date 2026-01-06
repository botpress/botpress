import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'

export type JsonSchema7NeverType = {
  not: {}
  [zuiKey]?: ZuiExtensionObject
}

export function parseNeverDef(): JsonSchema7NeverType {
  return {
    not: {},
  }
}

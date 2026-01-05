import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'
import { ZodBooleanDef } from '../../../z'

export type JsonSchema7BooleanType = {
  type: 'boolean'
  [zuiKey]?: ZuiExtensionObject
}

export function parseBooleanDef(def: ZodBooleanDef): JsonSchema7BooleanType {
  return {
    type: 'boolean',
    ...(def.coerce
      ? {
          [zuiKey]: {
            coerce: def.coerce || undefined,
          },
        }
      : {}),
  }
}

import { zuiKey } from '../../../z'
import { ZuiExtensionObject } from '../../../z'
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

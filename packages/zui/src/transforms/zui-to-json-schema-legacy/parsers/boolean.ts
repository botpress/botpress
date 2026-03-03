import { zuiKey } from '../../../consts'
import type { ZuiExtensionObject, ZodBooleanDef } from '../../../typings'

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

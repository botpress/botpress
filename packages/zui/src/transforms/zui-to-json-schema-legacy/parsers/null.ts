import { zuiKey } from '../../../z/consts'
import type { ZuiExtensionObject } from '../../../z/typings'
import { Refs } from '../Refs'

export type JsonSchema7NullType = {
  type: 'null'
  [zuiKey]?: ZuiExtensionObject
}

export function parseNullDef(refs: Refs): JsonSchema7NullType {
  return refs.target === 'openApi3'
    ? ({
        enum: ['null'],
        nullable: true,
      } as any)
    : {
        type: 'null',
      }
}

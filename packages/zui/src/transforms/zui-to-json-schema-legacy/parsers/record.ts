import { zuiKey, ZuiExtensionObject, ZodFirstPartyTypeKind, ZodMapDef, ZodRecordDef, ZodTypeAny } from '../../../z'
import { JsonSchema7Type, parseDef } from '../parseDef'
import { Refs } from '../Refs'
import { JsonSchema7EnumType } from './enum'
import { JsonSchema7ObjectType } from './object'
import { JsonSchema7StringType, parseStringDef } from './string'

type JsonSchema7RecordPropertyNamesType = Omit<JsonSchema7StringType, 'type'> | Omit<JsonSchema7EnumType, 'type'>

export type JsonSchema7RecordType = {
  type: 'object'
  additionalProperties: JsonSchema7Type
  propertyNames?: JsonSchema7RecordPropertyNamesType
  [zuiKey]?: ZuiExtensionObject
}

export function parseRecordDef(def: ZodRecordDef | ZodMapDef, refs: Refs): JsonSchema7RecordType {
  if (refs.target === 'openApi3' && def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      type: 'object',
      required: (def.keyType as ZodTypeAny)._def.values,
      properties: (def.keyType as ZodTypeAny)._def.values.reduce(
        (acc: Record<string, JsonSchema7Type>, key: string) => ({
          ...acc,
          [key]:
            parseDef((def.valueType as ZodTypeAny)._def, {
              ...refs,
              currentPath: [...refs.currentPath, 'properties', key],
            }) ?? {},
        }),
        {}
      ),
      additionalProperties: false,
    } satisfies JsonSchema7ObjectType as any
  }

  const schema: JsonSchema7RecordType = {
    type: 'object',
    additionalProperties:
      parseDef((def.valueType as ZodTypeAny)._def, {
        ...refs,
        currentPath: [...refs.currentPath, 'additionalProperties'],
      }) ?? {},
  }

  if (refs.target === 'openApi3') {
    return schema
  }

  if (
    def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodString &&
    (def.keyType as ZodTypeAny)._def.checks?.length
  ) {
    const keyType: JsonSchema7RecordPropertyNamesType = Object.entries(
      parseStringDef((def.keyType as ZodTypeAny)._def, refs)
    ).reduce((acc, [key, value]) => (key === 'type' ? acc : { ...acc, [key]: value }), {})

    return {
      ...schema,
      propertyNames: keyType,
    }
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      ...schema,
      propertyNames: {
        enum: (def.keyType as ZodTypeAny)._def.values,
      },
    }
  }

  return schema
}

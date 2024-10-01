import {
  type ZodAnyDef,
  type ZodArrayDef,
  type ZodBooleanDef,
  ZodFirstPartyTypeKind,
  type ZodLazyDef,
  type ZodNullDef,
  type ZodObjectDef,
  type ZodRecordDef,
  type ZodStringDef,
  type ZodSymbolDef,
  type ZodTypeAny,
  type ZodUndefinedDef,
  type ZodUnionDef,
  ZodNullableDef,
  ZodOptionalDef,
  ZodNumberDef,
  ZodEnumDef,
  ZodDefaultDef,
  z,
} from '../../z/index'
import { zuiKey } from '../../ui/constants'
import { JsonSchema7Type } from '../zui-to-json-schema/parseDef'
import { parseSchema } from './parsers/parseSchema'
import { ZuiExtensionObject } from '../../ui/types'
import { JSONSchemaExtended } from './types'

export const jsonSchemaToZodStr = (schema: JSONSchemaExtended): string => {
  return parseSchema(schema, {
    seen: new Map(),
    path: [],
  })
}

const jsonSchemaToZod = (schema: any): ZodTypeAny => {
  let code = jsonSchemaToZodStr(schema)
  code = code.replaceAll('errors: z.ZodError[]', 'errors')
  return new Function('z', `return ${code}`)(z) as ZodTypeAny
}

const applyZuiPropsRecursively = (zodField: ZodTypeAny, jsonSchemaField: any) => {
  if (jsonSchemaField[zuiKey] && zodField._def) {
    zodField._def[zuiKey] = jsonSchemaField[zuiKey]
  }

  if (zodField._def?.typeName === 'ZodObject' && jsonSchemaField.type === 'object' && jsonSchemaField.properties) {
    Object.entries(jsonSchemaField.properties).forEach(([key, nestedField]) => {
      const shape = typeof zodField._def.shape === 'function' ? zodField._def.shape() : zodField._def.shape

      if (shape[key]) {
        applyZuiPropsRecursively(shape[key], nestedField)
      }
    })
  }

  if (
    zodField._def?.typeName === 'ZodRecord' &&
    jsonSchemaField.type === 'object' &&
    jsonSchemaField.additionalProperties
  ) {
    applyZuiPropsRecursively(zodField._def.valueType, jsonSchemaField.additionalProperties)
  }

  if (jsonSchemaField.type === 'array' && jsonSchemaField.items) {
    const items = jsonSchemaField.items

    if (typeof items === 'object' && !Array.isArray(items)) {
      const arrayShape = zodField._def.type

      if (arrayShape) {
        applyZuiPropsRecursively(arrayShape, items)
      }
    } else if (Array.isArray(items)) {
      items.forEach((item, index) => {
        const def: z.ZodDef = zodField._def

        if (def.typeName === z.ZodFirstPartyTypeKind.ZodTuple) {
          applyZuiPropsRecursively(def.items[index]!, item)
        }
      })
    }
  }
}

export type ZodAllDefs =
  | ZodArrayDef
  | ZodObjectDef
  | ZodBooleanDef
  | ZodNullableDef
  | ZodNumberDef
  | ZodAnyDef
  | ZodSymbolDef
  | ZodLazyDef
  | ZodUndefinedDef
  | ZodNullDef
  | ZodEnumDef
  | ZodUnionDef
  | ZodRecordDef
  | ZodOptionalDef
  | ZodStringDef
  | ZodDefaultDef

export type ZodTypeKind = `${ZodFirstPartyTypeKind}`

export type ZodDef<Type extends ZodTypeKind> = Type extends 'ZodObject'
  ? ZodObjectDef
  : Type extends 'ZodArray'
    ? ZodArrayDef
    : Type extends 'ZodBoolean'
      ? ZodBooleanDef
      : Type extends 'ZodString'
        ? ZodStringDef
        : Type extends 'ZodSymbol'
          ? ZodSymbolDef
          : Type extends 'ZodAny'
            ? ZodAnyDef
            : Type extends 'ZodLazy'
              ? ZodLazyDef
              : Type extends 'ZodUndefined'
                ? ZodUndefinedDef
                : Type extends 'ZodNull'
                  ? ZodNullDef
                  : Type extends 'ZodUnion'
                    ? ZodUnionDef
                    : Type extends 'ZodRecord'
                      ? ZodRecordDef
                      : Type extends 'ZodNullable'
                        ? ZodNullableDef
                        : Type extends 'ZodOptional'
                          ? ZodOptionalDef
                          : Type extends 'ZodNumber'
                            ? ZodNumberDef
                            : Type extends 'ZodEnum'
                              ? ZodEnumDef
                              : Type extends 'ZodDefault'
                                ? ZodDefaultDef
                                : never

export const traverseZodDefinitions = (
  def: ZodDef<ZodFirstPartyTypeKind>,
  cb: <T extends ZodTypeKind>(type: T, def: ZodDef<T> & { [zuiKey]?: ZuiExtensionObject }, path: string[]) => void,
  path: string[] = [],
) => {
  switch (def.typeName) {
    case ZodFirstPartyTypeKind.ZodObject:
      const shape = def.shape()
      cb(ZodFirstPartyTypeKind.ZodObject, def, path)
      Object.entries(shape).forEach(([key, field]) => {
        traverseZodDefinitions(field._def, cb, [...path, key])
      })
      break

    case ZodFirstPartyTypeKind.ZodArray:
      cb(ZodFirstPartyTypeKind.ZodArray, def, path)
      traverseZodDefinitions(def.type._def, cb, [...path, '0'])
      break

    case ZodFirstPartyTypeKind.ZodLazy:
      cb(ZodFirstPartyTypeKind.ZodLazy, def, path)
      traverseZodDefinitions(def.getter()._def, cb, path)
      break

    case ZodFirstPartyTypeKind.ZodUnion:
      cb(ZodFirstPartyTypeKind.ZodUnion, def, path)
      def.options.forEach((option) => {
        traverseZodDefinitions(option._def, cb, path)
      })
      break

    case ZodFirstPartyTypeKind.ZodRecord:
      cb(ZodFirstPartyTypeKind.ZodRecord, def, path)
      traverseZodDefinitions(def, cb, [...path])
      break

    case ZodFirstPartyTypeKind.ZodUndefined:
      cb(ZodFirstPartyTypeKind.ZodUndefined, def, path)
      break

    case ZodFirstPartyTypeKind.ZodNull:
      cb(ZodFirstPartyTypeKind.ZodNull, def, path)
      break

    case ZodFirstPartyTypeKind.ZodBoolean:
      cb(ZodFirstPartyTypeKind.ZodBoolean, def, path)
      break

    case ZodFirstPartyTypeKind.ZodString:
      cb(ZodFirstPartyTypeKind.ZodString, def, path)
      break

    case ZodFirstPartyTypeKind.ZodSymbol:
      cb(ZodFirstPartyTypeKind.ZodSymbol, def, path)
      break

    case ZodFirstPartyTypeKind.ZodAny:
      cb(ZodFirstPartyTypeKind.ZodAny, def, path)
      break

    case ZodFirstPartyTypeKind.ZodUnion:
      cb(ZodFirstPartyTypeKind.ZodUnion, def, path)
      break

    case ZodFirstPartyTypeKind.ZodRecord:
      cb(ZodFirstPartyTypeKind.ZodRecord, def, path)
      break

    case ZodFirstPartyTypeKind.ZodNullable:
      cb(ZodFirstPartyTypeKind.ZodNullable, def, path)
      traverseZodDefinitions(def.innerType._def, cb, path)
      break
    case ZodFirstPartyTypeKind.ZodOptional:
      cb(ZodFirstPartyTypeKind.ZodOptional, def, path)
      traverseZodDefinitions(def.innerType._def, cb, path)
      break

    case ZodFirstPartyTypeKind.ZodNumber:
      cb(ZodFirstPartyTypeKind.ZodNumber, def, path)
      break

    case ZodFirstPartyTypeKind.ZodEnum:
      cb(ZodFirstPartyTypeKind.ZodEnum, def, path)
      break

    case ZodFirstPartyTypeKind.ZodDefault:
      cb(ZodFirstPartyTypeKind.ZodDefault, def, path)
      break
    default:
      throw new Error(`Unknown Zod type: ${(def as any).typeName}`)
  }
}

export const jsonSchemaToZui = (schema: JsonSchema7Type | any): ZodTypeAny => {
  const zodSchema = jsonSchemaToZod(schema)
  applyZuiPropsRecursively(zodSchema, schema)
  return zodSchema as unknown as ZodTypeAny
}

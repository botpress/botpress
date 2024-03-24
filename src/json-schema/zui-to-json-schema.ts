import { zodToJsonSchema, type JsonSchema7ArrayType, type JsonSchema7ObjectType } from '@bpinternal/zod-to-json-schema'
import type { JsonSchema7, ZuiExtension, ZuiTypeAny, ZuiType } from '../index'
import { zuiKey, ToZodType } from '../zui'
import type { ZuiSchemaOptions } from '../zui-schemas'
import { z } from 'zod'

type JsonSchemaWithZui = JsonSchema7 & {
  [zuiKey]?: ZuiExtension<ToZodType<ZuiType>, any>
  properties?: {
    [key: string]: any
  }
}

export const zuiToJsonSchema = (zuiType: ZuiTypeAny | z.ZodTypeAny, opts: ZuiSchemaOptions = {}): JsonSchemaWithZui => {
  const jsonSchema = zodToJsonSchema(zuiType as ToZodType<ZuiType>, opts)

  if (opts.$schemaUrl === false) {
    delete jsonSchema.$schema
  } else if (typeof opts.$schemaUrl === 'string') {
    jsonSchema.$schema = opts.$schemaUrl
  }

  return mergeZuiIntoJsonSchema(jsonSchema as JsonSchema7, zuiType, opts)
}

const isObject = (schema: JsonSchema7): schema is JsonSchema7ObjectType =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).type === 'object' && (schema as any).properties

const isArray = (schema: JsonSchema7): schema is JsonSchema7ArrayType =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).type === 'array'

const getShape = (zuiSchema?: ZuiType<any> | z.ZodTypeAny) => {
  if (!zuiSchema?._def) {
    return
  }

  // for z.lazy schemas
  if (zuiSchema._def.getter && typeof zuiSchema._def.getter === 'function') {
    return zuiSchema._def.getter()._def?.shape?.()
  }

  return zuiSchema._def.shape?.()
}

const mergeZuiIntoJsonSchema = (
  jsonSchema: JsonSchemaWithZui,
  zuiSchema: ZuiType<any> | z.ZodTypeAny,
  opts: ZuiSchemaOptions,
): JsonSchema7 => {
  const assignZuiProps = (value: JsonSchemaWithZui, ui: ZuiExtension<ToZodType<ZuiType>, any>['ui']) => {
    if (!opts.stripZuiProps) {
      Object.assign(value, { [zuiKey]: ui })
    }
  }

  if (isObject(jsonSchema)) {
    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      const shape = getShape(zuiSchema)

      if (shape?.[key]) {
        const innerZui = shape[key].ui as ZuiExtension<ToZodType<ZuiType>, any>['ui']

        assignZuiProps(value, innerZui)
        mergeZuiIntoJsonSchema(value, shape[key], opts)
      }
    }
  }

  if (isArray(jsonSchema)) {
    if (Array.isArray(jsonSchema.items)) {
      jsonSchema.items.forEach((item, index) => mergeZuiIntoJsonSchema(item, zuiSchema._def.typeOf[index], opts))
    } else if (jsonSchema.items) {
      mergeZuiIntoJsonSchema(jsonSchema.items, zuiSchema._def.typeOf, opts)
    }
  }

  if (zuiSchema && 'ui' in zuiSchema && zuiSchema?.ui) {
    assignZuiProps(jsonSchema, zuiSchema.ui)
  }

  return jsonSchema
}

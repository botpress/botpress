import { zodToJsonSchema, type JsonSchema7ArrayType, type JsonSchema7ObjectType } from '@bpinternal/zod-to-json-schema'
import type { JsonSchema7, ZuiExtension, ZuiTypeAny, ZuiType } from './index'
import { zuiKey, ToZodType } from './zui'
import type { ZuiSchemaOptions } from './zui-schemas'
import { z } from 'zod'

type JsonSchemaWithZui = JsonSchema7 & {
  [zuiKey]?: ZuiExtension<ToZodType<ZuiTypeAny>>
  properties?: { [key: string]: any }
}

export const zuiToJsonSchema = (zuiType: ZuiTypeAny | z.ZodTypeAny, opts: ZuiSchemaOptions = {}): JsonSchemaWithZui => {
  const jsonSchema = zodToJsonSchema(zuiType as ToZodType<ZuiTypeAny>, opts)

  if (opts.stripSchemaProps) {
    delete jsonSchema.$schema
  }

  return mergeZuiIntoJsonSchema(jsonSchema as JsonSchema7, zuiType, opts)
}

const isObject = (schema: JsonSchema7): schema is JsonSchema7ObjectType =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).type === 'object' && (schema as any).properties

const isArray = (schema: JsonSchema7): schema is JsonSchema7ArrayType =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).type === 'array'

const mergeZuiIntoJsonSchema = (
  jsonSchema: JsonSchemaWithZui,
  zuiSchema: ZuiType<any> | z.ZodTypeAny,
  opts: ZuiSchemaOptions,
): JsonSchema7 => {
  const assignZuiProps = (value: JsonSchemaWithZui, ui: ZuiExtension<ToZodType<ZuiTypeAny>>['ui']) => {
    if (ui?.examples) {
      Object.assign(value, { examples: ui.examples })
    }

    if (!opts.stripZuiProps) {
      Object.assign(value, { [zuiKey]: ui })
    }
  }

  if (isObject(jsonSchema)) {
    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      const shape = zuiSchema?._def.shape?.()

      if (shape?.[key]) {
        const innerZui = shape[key].ui as ZuiExtension<ToZodType<ZuiTypeAny>>['ui']

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

import { JSONSchema } from '../../ui/types'
import { zuiKey } from '../../ui/constants'
import type { z } from 'zod'
import { ArraySchema, ObjectSchema } from '../../ui/types'
import { zodToJsonSchema } from './zodToJsonSchema'
import { Options } from './Options'
import { JsonSchema7Type } from './parseDef'

export type ZuiSchemaOptions = {
  /**
   * The scope is the full path to the property defined in the JSON schema, the root node being represented by #
   * Objects doesn't have any scope, only  its child does
   * @default "#/properties/"
   * */
  rootScope?: string
  /**
   * Removes the "x-zui" property from the generated schema
   */
  stripZuiProps?: boolean
  /**
   * Sets the $schema path. If set to false, it will remove the $schema property from the schema
   */
  $schemaUrl?: string | false
  target?: 'jsonSchema7' | 'openApi3'
} & Partial<Pick<Options, 'unionStrategy' | 'discriminator'>>

export const zuiToJsonSchema = (
  zuiType: z.ZodTypeAny,
  opts: ZuiSchemaOptions = { target: 'jsonSchema7' },
): JSONSchema => {
  const jsonSchema = zodToJsonSchema(zuiType as z.ZodType, opts)

  if (opts.$schemaUrl === false) {
    delete jsonSchema.$schema
  } else if (typeof opts.$schemaUrl === 'string') {
    jsonSchema.$schema = opts.$schemaUrl
  }

  return mergeZuiIntoJsonSchema(jsonSchema as JSONSchema, zuiType, opts)
}

const isObject = (schema: JsonSchema7Type): schema is ObjectSchema =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).type === 'object' && (schema as any).properties

const isArray = (schema: JsonSchema7Type): schema is ArraySchema =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).type === 'array'

const getShape = (zuiSchema?: z.ZodTypeAny) => {
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
  jsonSchema: JSONSchema,
  zuiSchema: z.ZodTypeAny,
  opts: ZuiSchemaOptions,
): JSONSchema => {
  const assignZuiProps = (value: JSONSchema, ui: any) => {
    if (!opts.stripZuiProps) {
      Object.assign(value, { [zuiKey]: ui })
    }
  }

  if (isObject(jsonSchema)) {
    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      const shape = getShape(zuiSchema)

      if (shape?.[key]) {
        const innerZui = shape[key].ui

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

import { JSONSchema } from '../../ui/types'
import { zuiKey } from '../../ui/constants'
import { z } from '../../z/index'
import { zodToJsonSchema } from './zodToJsonSchema'
import { Options } from './Options'

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

export const zuiToJsonSchema = (zuiType: z.ZodTypeAny, opts: ZuiSchemaOptions = { target: 'openApi3' }): JSONSchema => {
  const jsonSchema = zodToJsonSchema(zuiType as z.ZodType, opts)

  if (opts.$schemaUrl === false) {
    delete jsonSchema.$schema
  } else if (typeof opts.$schemaUrl === 'string') {
    jsonSchema.$schema = opts.$schemaUrl
  }

  return mergeZuiIntoJsonSchema(jsonSchema as JSONSchema, zuiType, opts)
}

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

  if (jsonSchema.type === 'object' && jsonSchema.properties) {
    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      const shape = getShape(zuiSchema)

      if (shape?.[key]) {
        const innerZui = shape[key].ui

        assignZuiProps(value, innerZui)
        mergeZuiIntoJsonSchema(value, shape[key], opts)
      }
    }
  }

  if (jsonSchema.type == 'array') {
    if (Array.isArray(jsonSchema.items)) {
      const def: z.ZodDef = zuiSchema._def
      if (def.typeName === z.ZodFirstPartyTypeKind.ZodTuple) {
        jsonSchema.items.forEach((item, index) => {
          const current = def.items[index]
          current && mergeZuiIntoJsonSchema(item, current, opts)
        })
      }
    } else if (jsonSchema.items) {
      mergeZuiIntoJsonSchema(jsonSchema.items, zuiSchema._def.type, opts)
    }
  }

  if (zuiSchema && 'ui' in zuiSchema && zuiSchema?.ui) {
    assignZuiProps(jsonSchema, zuiSchema.ui)
  }

  return jsonSchema
}

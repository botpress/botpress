import * as z from '../../../z'
import { JsonSchema7Type, parseDef } from '../parseDef'
import { Refs } from '../Refs'

const { zuiKey } = z

export type JsonSchema7ObjectType = {
  type: 'object'
  properties: Record<string, JsonSchema7Type>
  additionalProperties: boolean | JsonSchema7Type
  required?: string[]
  [zuiKey]?: z.ZuiExtensionObject
}

const getAdditionalProperties = (def: z.ZodObjectDef, refs: Refs): boolean | JsonSchema7Type => {
  if (z.is.zuiType(def.unknownKeys)) {
    return (
      parseDef((def.unknownKeys as z.ZodTypeAny)._def, {
        ...refs,
        currentPath: [...refs.currentPath, 'additionalProperties'],
      }) ?? true
    )
  }
  if (def.unknownKeys === 'passthrough') {
    return true
  }
  return false
}

export function parseObjectDefX(def: z.ZodObjectDef, refs: Refs) {
  Object.keys(def.shape()).reduce(
    (schema: JsonSchema7ObjectType, key) => {
      let prop = def.shape()[key] as z.ZodTypeAny
      if (typeof prop === 'undefined' || typeof prop._def === 'undefined') {
        return schema
      }

      const isOptional = prop.isOptional()

      if (!isOptional) {
        prop = { ...prop._def.innerSchema }
      }

      const propSchema = parseDef(prop!._def, {
        ...refs,
        currentPath: [...refs.currentPath, 'properties', key],
        propertyPath: [...refs.currentPath, 'properties', key],
      })

      if (propSchema !== undefined) {
        schema.properties[key] = propSchema

        if (!isOptional) {
          if (!schema.required) {
            schema.required = []
          }

          schema.required.push(key)
        }
      }

      return schema
    },
    {
      type: 'object',
      properties: {},
      additionalProperties: getAdditionalProperties(def, refs),
    }
  )

  const result: JsonSchema7ObjectType = {
    type: 'object',
    ...Object.entries(def.shape()).reduce(
      (
        acc: {
          properties: Record<string, JsonSchema7Type>
          required: string[]
        },
        [propName, propDef]: [string, z.ZodTypeAny]
      ) => {
        if (propDef === undefined || propDef._def === undefined) return acc
        const parsedDef = parseDef(propDef._def, {
          ...refs,
          currentPath: [...refs.currentPath, 'properties', propName],
          propertyPath: [...refs.currentPath, 'properties', propName],
        })
        if (parsedDef === undefined) return acc
        return {
          properties: { ...acc.properties, [propName]: parsedDef },
          required: propDef.isOptional() ? acc.required : [...acc.required, propName],
        }
      },
      { properties: {}, required: [] }
    ),
    additionalProperties: getAdditionalProperties(def, refs),
  }
  if (!result.required!.length) delete result.required
  return result
}

export function parseObjectDef(def: z.ZodObjectDef, refs: Refs) {
  const result: JsonSchema7ObjectType = {
    type: 'object',
    ...Object.entries(def.shape()).reduce(
      (
        acc: {
          properties: Record<string, JsonSchema7Type>
          required: string[]
        },
        [propName, propDef]: [string, z.ZodTypeAny]
      ) => {
        if (propDef === undefined || propDef._def === undefined) return acc
        const parsedDef = parseDef(propDef._def, {
          ...refs,
          currentPath: [...refs.currentPath, 'properties', propName],
          propertyPath: [...refs.currentPath, 'properties', propName],
        })
        if (parsedDef === undefined) return acc
        return {
          properties: { ...acc.properties, [propName]: parsedDef },
          required: propDef.isOptional() ? acc.required : [...acc.required, propName],
        }
      },
      { properties: {}, required: [] }
    ),
    additionalProperties: getAdditionalProperties(def, refs),
  }
  if (!result.required!.length) delete result.required
  return result
}

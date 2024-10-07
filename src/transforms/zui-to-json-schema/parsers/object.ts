import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'
import { ZodObjectDef } from '../../../z/index'
import { JsonSchema7Type, parseDef } from '../parseDef'
import { Refs } from '../Refs'

export type JsonSchema7ObjectType = {
  type: 'object'
  properties: Record<string, JsonSchema7Type>
  additionalProperties: boolean | JsonSchema7Type
  required?: string[]
  [zuiKey]?: ZuiExtensionObject
}

export function parseObjectDefX(def: ZodObjectDef, refs: Refs) {
  Object.keys(def.shape()).reduce(
    (schema: JsonSchema7ObjectType, key) => {
      let prop = def.shape()[key]
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
      additionalProperties:
        def.catchall._def.typeName === 'ZodNever'
          ? def.unknownKeys === 'passthrough'
          : (parseDef(def.catchall._def, {
              ...refs,
              currentPath: [...refs.currentPath, 'additionalProperties'],
            }) ?? true),
    },
  )

  const result: JsonSchema7ObjectType = {
    type: 'object',
    ...Object.entries(def.shape()).reduce(
      (
        acc: {
          properties: Record<string, JsonSchema7Type>
          required: string[]
        },
        [propName, propDef],
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
      { properties: {}, required: [] },
    ),
    additionalProperties:
      def.catchall._def.typeName === 'ZodNever'
        ? def.unknownKeys === 'passthrough'
        : (parseDef(def.catchall._def, {
            ...refs,
            currentPath: [...refs.currentPath, 'additionalProperties'],
          }) ?? true),
  }
  if (!result.required!.length) delete result.required
  return result
}

export function parseObjectDef(def: ZodObjectDef, refs: Refs) {
  const result: JsonSchema7ObjectType = {
    type: 'object',
    ...Object.entries(def.shape()).reduce(
      (
        acc: {
          properties: Record<string, JsonSchema7Type>
          required: string[]
        },
        [propName, propDef],
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
      { properties: {}, required: [] },
    ),
    additionalProperties:
      def.catchall._def.typeName === 'ZodNever'
        ? def.unknownKeys === 'passthrough'
        : (parseDef(def.catchall._def, {
            ...refs,
            currentPath: [...refs.currentPath, 'additionalProperties'],
          }) ?? true),
  }
  if (!result.required!.length) delete result.required
  return result
}

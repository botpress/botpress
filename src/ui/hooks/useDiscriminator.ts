import { useMemo, useEffect } from 'react'
import { JSONSchema, ObjectSchema, Path } from '../types'
import { useFormData } from './useFormData'
import { zuiKey } from '../constants'

export const useDiscriminator = (fieldSchema: JSONSchema, path: Path) => {
  const { handlePropertyChange, data } = useFormData(fieldSchema, path)

  const { discriminator, value, discriminatedSchema } = useMemo(() => {
    const discriminator = resolveDiscriminator(fieldSchema.anyOf)
    const value = discriminator?.key ? data?.[discriminator.key] : fieldSchema.default || null
    const discriminatedSchema = resolveDiscriminatedSchema(discriminator?.key || null, value, fieldSchema.anyOf)
    return {
      discriminator,
      value,
      discriminatedSchema,
    }
  }, [fieldSchema.anyOf, data])

  useEffect(() => {
    if (
      discriminator?.key &&
      discriminator?.values.length &&
      Object.keys(data || {}).length < 1 &&
      !fieldSchema.default
    ) {
      handlePropertyChange(path, { [discriminator.key]: discriminator.values[0] })
    }
  }, [])

  return { discriminator, discriminatorValue: value, discriminatedSchema }
}

export const resolveDiscriminator = (anyOf: ObjectSchema['anyOf']) => {
  const output = anyOf
    ?.map((schema) => {
      if (schema.type !== 'object') {
        return null
      }
      if (!schema.properties) {
        return null
      }
      return Object.entries(schema.properties)
        .map(([key, def]) => {
          if (def.type === 'string' && def.enum?.length) {
            return { key, value: def.enum[0] }
          }
          return null
        })
        .filter((v): v is { key: string; value: string } => !!v)
    })
    .flat()
    .reduce(
      (acc, data) => {
        if (!data) {
          return acc
        }
        const { key, value } = data
        if (acc.key === null) {
          acc.key = key
        }
        if (acc.key === key) {
          acc.values.push(value)
        }

        return acc
      },
      { key: null as string | null, values: [] as string[] },
    )

  if (output?.key === null || !output?.values.length) {
    return null
  }
  return output
}

export const resolveDiscriminatedSchema = (key: string | null, value: string | null, anyOf: ObjectSchema['anyOf']) => {
  if (!anyOf?.length || !key || !value) {
    return null
  }
  for (const schema of anyOf) {
    if (schema.type !== 'object') {
      continue
    }
    const discriminator = schema.properties?.[key]
    if (discriminator?.type === 'string' && discriminator.enum?.length && discriminator.enum[0] === value) {
      return {
        ...schema,
        properties: {
          ...schema.properties,
          [key]: { ...discriminator, [zuiKey]: { hidden: true } },
        },
      } as ObjectSchema
    }
  }
  return null
}

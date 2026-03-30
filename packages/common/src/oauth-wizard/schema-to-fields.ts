import { z, ZodFirstPartyTypeKind } from '@botpress/sdk'

export type FormFieldDescriptor = {
  name: string
  label: string
  inputType: 'text' | 'number' | 'email' | 'password' | 'url' | 'checkbox' | 'select'
  placeholder?: string
  required: boolean
  disabled: boolean
  hidden: boolean
  defaultValue?: string
  options?: { label: string; value: string }[]
  description?: string
  error?: string
  previousValue?: string
}

function extractDefaultValue(schema: z.ZodTypeAny): string | undefined {
  let current = schema
  while (true) {
    const typeName = current._def.typeName as ZodFirstPartyTypeKind
    if (typeName === ZodFirstPartyTypeKind.ZodDefault) {
      const def = current._def as { defaultValue: () => unknown }
      return String(def.defaultValue())
    }
    const innerType = (current._def as { innerType?: z.ZodTypeAny }).innerType
    if (!innerType) {
      return undefined
    }
    current = innerType
  }
}

function resolveInputType(
  schema: z.ZodTypeAny,
  meta: Record<string, unknown>
): { inputType: FormFieldDescriptor['inputType']; options?: { label: string; value: string }[] } {
  const typeName = schema._def.typeName as ZodFirstPartyTypeKind

  if (typeName === ZodFirstPartyTypeKind.ZodBoolean) {
    return { inputType: 'checkbox' }
  }

  if (typeName === ZodFirstPartyTypeKind.ZodNumber) {
    return { inputType: 'number' }
  }

  if (typeName === ZodFirstPartyTypeKind.ZodEnum) {
    const values = (schema._def as { values: string[] }).values
    return {
      inputType: 'select',
      options: values.map((v) => ({ label: v, value: v })),
    }
  }

  if (typeName === ZodFirstPartyTypeKind.ZodString) {
    if (meta.secret) {
      return { inputType: 'password' }
    }

    const checks = (schema._def as { checks?: { kind: string }[] }).checks ?? []
    for (const check of checks) {
      if (check.kind === 'email') {
        return { inputType: 'email' }
      }
      if (check.kind === 'url') {
        return { inputType: 'url' }
      }
    }

    return { inputType: 'text' }
  }

  return { inputType: 'text' }
}

function capitalizeFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

export function schemaToFieldDescriptors(
  schema: z.AnyZodObject,
  errors?: Record<string, string>,
  previousValues?: Record<string, string>
): FormFieldDescriptor[] {
  const shape = schema.shape as Record<string, z.ZodTypeAny>
  const fields: FormFieldDescriptor[] = []

  for (const [name, fieldSchema] of Object.entries(shape)) {
    const inner = fieldSchema.naked()
    const meta = inner.getMetadata()
    const { inputType, options } = resolveInputType(inner, meta)

    fields.push({
      name,
      label: (meta.title as string) ?? capitalizeFieldName(name),
      inputType,
      placeholder: meta.placeholder as string | undefined,
      required: !fieldSchema.isOptional(),
      disabled: meta.disabled === true,
      hidden: meta.hidden === true,
      defaultValue: extractDefaultValue(fieldSchema),
      options,
      description: inner._def.description as string | undefined,
      error: errors?.[name],
      previousValue: previousValues?.[name],
    })
  }

  return fields
}

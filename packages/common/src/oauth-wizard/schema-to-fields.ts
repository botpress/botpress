import { z } from '@botpress/sdk'

export type HtmlInputType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'url'
  | 'date'
  | 'time'
  | 'color'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'textarea'
  | 'hidden'

export type FormFieldDescriptor = {
  name: string
  label: string
  inputType: HtmlInputType
  displayAsParams: Record<string, unknown>
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

type ZuiMetadata = {
  displayAs?: [string, Record<string, unknown>]
  title?: string
  placeholder?: string
  hidden?: boolean | string
  disabled?: boolean | string
}

const DISPLAY_AS_TO_HTML: Record<string, HtmlInputType> = {
  switch: 'checkbox',
  checkbox: 'checkbox',
  radiogroup: 'radio',
  dropdown: 'select',
  select: 'select',
  password: 'password',
  secret: 'password',
  number: 'number',
  email: 'email',
  url: 'url',
  date: 'date',
  time: 'time',
  color: 'color',
  hidden: 'hidden',
  textarea: 'textarea',
}

function resolveHtmlInputType(displayAsId: string | undefined, naked: z.ZodType, hasEnum: boolean): HtmlInputType {
  if (displayAsId) {
    const mapped = DISPLAY_AS_TO_HTML[displayAsId]
    if (mapped) {
      return mapped
    }
  }

  if (hasEnum) {
    return 'select'
  }
  if (z.is.zuiBoolean(naked)) {
    return 'checkbox'
  }
  if (z.is.zuiNumber(naked)) {
    return 'number'
  }
  return 'text'
}

function capitalizeFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

function findDefault(field: z.ZodType): unknown {
  let current: z.ZodType = field
  while (current) {
    if (z.is.zuiDefault(current)) {
      return current._def.defaultValue()
    }
    if ('innerType' in current._def) {
      current = (current._def as { innerType: z.ZodType }).innerType
    } else {
      break
    }
  }
  return undefined
}

export function schemaToFieldDescriptors<T extends z.ZodObject>(
  schema: T,
  errors?: z.ZodError<T['_def']>,
  previousValues?: T['_input']
): FormFieldDescriptor[] {
  const fields: FormFieldDescriptor[] = []

  for (const [name, field] of Object.entries(schema.shape) as [string, z.ZodType][]) {
    const zui = field._def[z.zuiKey] as ZuiMetadata | undefined
    const naked = field.naked()
    const displayAs = zui?.displayAs
    const displayAsId = displayAs?.[0]
    const displayAsParams = displayAs?.[1] ?? {}
    const isEnum = z.is.zuiEnum(naked)
    const options = isEnum ? (naked._def.values as string[]).map((v) => ({ label: v, value: v })) : undefined
    const inputType = resolveHtmlInputType(displayAsId, naked, isEnum)
    const defaultValue = findDefault(field)

    fields.push({
      name,
      label: zui?.title ?? capitalizeFieldName(name),
      inputType,
      displayAsParams,
      placeholder: zui?.placeholder,
      required: !field.isOptional(),
      disabled: zui?.disabled === true,
      hidden: zui?.hidden === true,
      defaultValue: defaultValue != null ? String(defaultValue) : undefined,
      options,
      description: field._def.description as string | undefined,
      error: errors?.issues.find((issue) => issue.path[0] === name)?.message,
      previousValue: previousValues?.[name] != null ? String(previousValues[name]) : undefined,
    })
  }

  return fields
}

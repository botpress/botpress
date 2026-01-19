import { z } from '@botpress/sdk'

const baseField = z
  .object({
    key: z.string().min(1),
    label: z.string().nullable().optional(),
    type: z.string().min(1),
  })
  .passthrough()

const optionSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().nullable().optional(),
  })
  .passthrough()

const fileSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().nullable().optional(),
    url: z.string().url().optional(),
    mimeType: z.string().nullable().optional(),
    size: z.number().optional(),
  })
  .passthrough()

const optionsFieldBase = baseField.extend({
  value: z.array(z.string()).nullable().optional(),
  options: z.array(optionSchema).optional(),
})

const multiSelectField = optionsFieldBase.extend({
  type: z.literal('MULTI_SELECT'),
})
const dropdownField = optionsFieldBase.extend({
  type: z.literal('DROPDOWN'),
})
const multipleChoiceField = optionsFieldBase.extend({
  type: z.literal('MULTIPLE_CHOICE'),
})
const rankingField = optionsFieldBase.extend({
  type: z.literal('RANKING'),
})

const checkboxesField = baseField.extend({
  type: z.literal('CHECKBOXES'),
  value: z
    .union([z.array(z.string()), z.boolean()])
    .nullable()
    .optional(),
  options: z.array(optionSchema).optional(),
})

const fileUploadField = baseField.extend({
  type: z.literal('FILE_UPLOAD'),
  value: z.array(fileSchema).nullable().optional(),
})
const signatureField = baseField.extend({
  type: z.literal('SIGNATURE'),
  value: z.array(fileSchema).nullable().optional(),
})

const matrixField = baseField.extend({
  type: z.literal('MATRIX'),
  value: z.record(z.array(z.string())).nullable().optional(),
  rows: z.array(optionSchema).optional(),
  columns: z.array(optionSchema).optional(),
})

const knownSpecialFieldSchema = z.discriminatedUnion('type', [
  multiSelectField,
  dropdownField,
  checkboxesField,
  multipleChoiceField,
  rankingField,
  fileUploadField,
  signatureField,
  matrixField,
])

const fallbackFieldSchema = baseField
  .extend({
    value: z.any().optional(),
    options: z.any().optional(),
  })
  .passthrough()

export const tallyFieldSchema = z.union([knownSpecialFieldSchema, fallbackFieldSchema])

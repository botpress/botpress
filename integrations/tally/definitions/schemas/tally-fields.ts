import { z } from '@botpress/sdk'

const baseField = z
  .object({
    key: z.string().min(1).title('Key').describe('Field key identifier'),
    label: z.string().nullable().optional().title('Label').describe('Field label'),
    type: z.string().min(1).title('Type').describe('Field type'),
  })
  .passthrough()

const optionSchema = z
  .object({
    id: z.string().min(1).title('ID').describe('Option ID'),
    text: z.string().nullable().optional().title('Text').describe('Option text'),
  })
  .passthrough()

const fileSchema = z
  .object({
    id: z.string().optional().title('ID').describe('File ID'),
    name: z.string().nullable().optional().title('Name').describe('File name'),
    url: z.string().url().optional().title('URL').describe('File URL'),
    mimeType: z.string().nullable().optional().title('MIME Type').describe('File MIME type'),
    size: z.number().optional().title('Size').describe('File size in bytes'),
  })
  .passthrough()

const optionsFieldBase = baseField.extend({
  value: z.array(z.string()).nullable().optional().title('Value').describe('Selected option values'),
  options: z.array(optionSchema).optional().title('Options').describe('Available options'),
})

const multiSelectField = optionsFieldBase.extend({
  type: z.literal('MULTI_SELECT').title('Type').describe('Field type'),
})
const dropdownField = optionsFieldBase.extend({
  type: z.literal('DROPDOWN').title('Type').describe('Field type'),
})
const multipleChoiceField = optionsFieldBase.extend({
  type: z.literal('MULTIPLE_CHOICE').title('Type').describe('Field type'),
})
const rankingField = optionsFieldBase.extend({
  type: z.literal('RANKING').title('Type').describe('Field type'),
})

const checkboxesField = baseField.extend({
  type: z.literal('CHECKBOXES').title('Type').describe('Field type'),
  value: z
    .union([z.array(z.string()), z.boolean()])
    .nullable()
    .optional()
    .title('Value')
    .describe('Checkbox values'),
  options: z.array(optionSchema).optional().title('Options').describe('Available checkbox options'),
})

const fileUploadField = baseField.extend({
  type: z.literal('FILE_UPLOAD').title('Type').describe('Field type'),
  value: z.array(fileSchema).nullable().optional().title('Value').describe('Uploaded files'),
})
const signatureField = baseField.extend({
  type: z.literal('SIGNATURE').title('Type').describe('Field type'),
  value: z.array(fileSchema).nullable().optional().title('Value').describe('Signature files'),
})

const matrixField = baseField.extend({
  type: z.literal('MATRIX').title('Type').describe('Field type'),
  value: z.record(z.array(z.string())).nullable().optional().title('Value').describe('Matrix values'),
  rows: z.array(optionSchema).optional().title('Rows').describe('Matrix rows'),
  columns: z.array(optionSchema).optional().title('Columns').describe('Matrix columns'),
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
    value: z.any().optional().title('Value').describe('Field value'),
    options: z.any().optional().title('Options').describe('Field options'),
  })
  .passthrough()

export const tallyFieldSchema = z.union([knownSpecialFieldSchema, fallbackFieldSchema])

import { z } from '@botpress/sdk'

const airtableFieldType = z.enum([
  'singleLineText',
  'email',
  'url',
  'multilineText',
  'phoneNumber',
  'richText',
  'singleCollaborator',
  'multipleCollaborators',
  'multipleAttachments',
  'autoNumber',
  'barcode',
  'button',
  'checkbox',
  'count',
  'createdBy',
  'createdTime',
  'currency',
  'date',
  'dateTime',
  'duration',
  'externalSyncSource',
  'formula',
  'lastModifiedBy',
  'lastModifiedTime',
  'multipleRecordLinks',
  'multipleSelects',
  'number',
  'percent',
  'rating',
  'rollup',
  'singleSelect',
  'multipleLookupValues',
  'aiText',
])

const baseField = z.object({
  name: z.string().min(1).title('Field Name').describe('The name of the field'),
  description: z.string().optional().title('Description').describe('The description of the field'),
})

// Shared enums

const baseColors = [
  'greenBright',
  'tealBright',
  'cyanBright',
  'blueBright',
  'purpleBright',
  'pinkBright',
  'redBright',
  'orangeBright',
  'yellowBright',
  'grayBright',
] as const

const extendedColors = [
  ...baseColors,
  'blueLight',
  'blueDark',
  'cyanLight',
  'cyanDark',
  'tealLight',
  'tealDark',
  'greenLight',
  'greenDark',
  'yellowLight',
  'yellowDark',
  'orangeLight',
  'orangeDark',
  'redLight',
  'redDark',
  'pinkLight',
  'pinkDark',
  'purpleLight',
  'purpleDark',
  'grayLight',
  'grayDark',
] as const

const ratingIcons = ['star', 'heart', 'thumbsUp', 'flag', 'dot'] as const
const checkboxIcons = [...ratingIcons, 'check', 'xCheckbox'] as const

// Shared sub-schemas

const dateFormatSchema = z.object({
  name: z.enum(['local', 'friendly', 'us', 'european', 'iso']).title('Format Name').describe('Date format name'),
  format: z.string().optional().title('Format String').describe('Date format string'),
})

const timeFormatSchema = z.object({
  name: z.enum(['12hour', '24hour']).title('Format Name').describe('Time format name'),
  format: z.string().optional().title('Format String').describe('Time format string'),
})

const choiceSchema = z.object({
  name: z.string().title('Name').describe('Choice name'),
  color: z.enum(extendedColors).optional().title('Color').describe('Choice color'),
})

// Simple fields (no options)

const singleLineTextField = baseField.extend({
  type: airtableFieldType.extract(['singleLineText']),
})

const emailField = baseField.extend({
  type: airtableFieldType.extract(['email']),
})

const urlField = baseField.extend({
  type: airtableFieldType.extract(['url']),
})

const multilineTextField = baseField.extend({
  type: airtableFieldType.extract(['multilineText']),
})

const phoneNumberField = baseField.extend({
  type: airtableFieldType.extract(['phoneNumber']),
})

const richTextField = baseField.extend({
  type: airtableFieldType.extract(['richText']),
})

const singleCollaboratorField = baseField.extend({
  type: airtableFieldType.extract(['singleCollaborator']),
})

const multipleCollaboratorsField = baseField.extend({
  type: airtableFieldType.extract(['multipleCollaborators']),
})

const autoNumberField = baseField.extend({
  type: airtableFieldType.extract(['autoNumber']),
})

const barcodeField = baseField.extend({
  type: airtableFieldType.extract(['barcode']),
})

const buttonField = baseField.extend({
  type: airtableFieldType.extract(['button']),
})

const countField = baseField.extend({
  type: airtableFieldType.extract(['count']),
})

const createdByField = baseField.extend({
  type: airtableFieldType.extract(['createdBy']),
})

const externalSyncSourceField = baseField.extend({
  type: airtableFieldType.extract(['externalSyncSource']),
})

const formulaField = baseField.extend({
  type: airtableFieldType.extract(['formula']),
})

const lastModifiedByField = baseField.extend({
  type: airtableFieldType.extract(['lastModifiedBy']),
})

const multipleLookupValuesField = baseField.extend({
  type: airtableFieldType.extract(['multipleLookupValues']),
})

const aiTextField = baseField.extend({
  type: airtableFieldType.extract(['aiText']),
})

// Fields with options

const multipleAttachmentsField = baseField.extend({
  type: airtableFieldType.extract(['multipleAttachments']),
  options: z
    .object({
      isReversed: z.boolean().optional().describe('Whether attachments are in reverse order'),
    })
    .optional()
    .title('Options')
    .describe('Attachment field options'),
})

const checkboxField = baseField.extend({
  type: airtableFieldType.extract(['checkbox']),
  options: z
    .object({
      color: z.enum(baseColors).title('Color').describe('Checkbox color'),
      icon: z.enum(checkboxIcons).title('Icon').describe('Checkbox icon'),
    })
    .title('Options')
    .describe('Checkbox display options'),
})

const currencyField = baseField.extend({
  type: airtableFieldType.extract(['currency']),
  options: z
    .object({
      precision: z.number().min(0).max(7).title('Precision').describe('Number of decimal places (0-7)'),
      symbol: z.string().title('Symbol').describe('Currency symbol (e.g. "$")'),
    })
    .title('Options')
    .describe('Currency field options'),
})

const dateField = baseField.extend({
  type: airtableFieldType.extract(['date']),
  options: z
    .object({
      dateFormat: dateFormatSchema.title('Date Format').describe('Date format configuration'),
    })
    .title('Options')
    .describe('Date field options'),
})

const dateTimeField = baseField.extend({
  type: airtableFieldType.extract(['dateTime']),
  options: z
    .object({
      dateFormat: dateFormatSchema.title('Date Format').describe('Date format configuration'),
      timeFormat: timeFormatSchema.title('Time Format').describe('Time format configuration'),
      timeZone: z.string().title('Time Zone').describe('Time zone identifier (e.g. "America/New_York")'),
    })
    .title('Options')
    .describe('DateTime field options'),
})

const durationField = baseField.extend({
  type: airtableFieldType.extract(['duration']),
  options: z
    .object({
      durationFormat: z
        .enum(['h:mm', 'h:mm:ss', 'h:mm:ss.S', 'h:mm:ss.SS', 'h:mm:ss.SSS'])
        .title('Duration Format')
        .describe('Duration display format'),
    })
    .title('Options')
    .describe('Duration field options'),
})

const numberField = baseField.extend({
  type: airtableFieldType.extract(['number']),
  options: z
    .object({
      precision: z.number().min(0).max(8).title('Precision').describe('Number of decimal places (0-8)'),
    })
    .title('Options')
    .describe('Number field options'),
})

const percentField = baseField.extend({
  type: airtableFieldType.extract(['percent']),
  options: z
    .object({
      precision: z.number().min(0).max(8).title('Precision').describe('Number of decimal places (0-8)'),
    })
    .title('Options')
    .describe('Percent field options'),
})

const ratingField = baseField.extend({
  type: airtableFieldType.extract(['rating']),
  options: z
    .object({
      max: z.number().min(1).max(10).title('Max').describe('Maximum rating value (1-10)'),
      color: z.enum(baseColors).title('Color').describe('Rating color'),
      icon: z.enum(ratingIcons).title('Icon').describe('Rating icon'),
    })
    .title('Options')
    .describe('Rating field options'),
})

const singleSelectField = baseField.extend({
  type: airtableFieldType.extract(['singleSelect']),
  options: z
    .object({
      choices: z.array(choiceSchema).title('Choices').describe('Available choices'),
    })
    .title('Options')
    .describe('Single select options'),
})

const multipleSelectsField = baseField.extend({
  type: airtableFieldType.extract(['multipleSelects']),
  options: z
    .object({
      choices: z.array(choiceSchema).title('Choices').describe('Available choices'),
    })
    .title('Options')
    .describe('Multiple select options'),
})

const multipleRecordLinksField = baseField.extend({
  type: airtableFieldType.extract(['multipleRecordLinks']),
  options: z
    .object({
      linkedTableId: z.string().title('Linked Table ID').describe('ID of the linked table'),
      prefersSingleRecordLink: z
        .boolean()
        .optional()
        .title('Prefers Single Record Link')
        .describe('Whether to prefer a single record link'),
      inverseLinkFieldId: z.string().optional().title('Inverse Link Field ID').describe('ID of the inverse link field'),
      viewIdForRecordSelection: z
        .string()
        .optional()
        .title('View ID for Record Selection')
        .describe('ID of the view for record selection'),
      isReversed: z.boolean().optional().title('Is Reversed').describe('Whether the link is reversed'),
    })
    .title('Options')
    .describe('Record link options'),
})

const createdTimeField = baseField.extend({
  type: airtableFieldType.extract(['createdTime']),
  options: z
    .object({
      result: z.object({}).passthrough().optional().title('Result').describe('Result type configuration'),
    })
    .optional()
    .title('Options')
    .describe('Created time field options'),
})

const lastModifiedTimeField = baseField.extend({
  type: airtableFieldType.extract(['lastModifiedTime']),
  options: z
    .object({
      result: z.object({}).passthrough().optional().title('Result').describe('Result type configuration'),
    })
    .optional()
    .title('Options')
    .describe('Last modified time field options'),
})

const rollupField = baseField.extend({
  type: airtableFieldType.extract(['rollup']),
  options: z
    .object({
      fieldIdInLinkedTable: z
        .string()
        .title('Field ID in Linked Table')
        .describe('ID of the field in the linked table'),
      recordLinkFieldId: z.string().title('Record Link Field ID').describe('ID of the record link field'),
      result: z.object({}).passthrough().optional().title('Result').describe('Result type configuration'),
      referencedFieldIds: z
        .array(z.string())
        .optional()
        .title('Referenced Field IDs')
        .describe('IDs of referenced fields'),
    })
    .optional()
    .title('Options')
    .describe('Rollup field options'),
})

// Full discriminated union (all field types, for API responses)

export const airtableFieldSchema = z.discriminatedUnion('type', [
  singleLineTextField,
  emailField,
  urlField,
  multilineTextField,
  phoneNumberField,
  richTextField,
  singleCollaboratorField,
  multipleCollaboratorsField,
  multipleAttachmentsField,
  autoNumberField,
  barcodeField,
  buttonField,
  checkboxField,
  countField,
  createdByField,
  createdTimeField,
  currencyField,
  dateField,
  dateTimeField,
  durationField,
  externalSyncSourceField,
  formulaField,
  lastModifiedByField,
  lastModifiedTimeField,
  multipleRecordLinksField,
  multipleSelectsField,
  numberField,
  percentField,
  ratingField,
  rollupField,
  singleSelectField,
  multipleLookupValuesField,
  aiTextField,
])

// Creatable subset (excludes read-only/computed field types)

export const creatableFieldSchema = z.discriminatedUnion('type', [
  singleLineTextField,
  emailField,
  urlField,
  multilineTextField,
  phoneNumberField,
  richTextField,
  singleCollaboratorField,
  multipleCollaboratorsField,
  multipleAttachmentsField,
  checkboxField,
  currencyField,
  dateField,
  dateTimeField,
  durationField,
  multipleRecordLinksField,
  multipleSelectsField,
  numberField,
  percentField,
  ratingField,
  singleSelectField,
])

export type AirtableField = z.infer<typeof airtableFieldSchema>
export type CreatableField = z.infer<typeof creatableFieldSchema>

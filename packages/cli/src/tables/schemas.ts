import * as sdk from '@botpress/sdk'

// FIXME: The table column schemas are defined in @bpinternal/tables-api, but
//        they're not exported, so we have to redefine them here. Ideally, we
//        should have a single source of truth for these types.

const commonProps = {
  'x-zui': sdk.z
    .object({
      index: sdk.z.number().optional().describe('Index of the column in the table'),
      typings: sdk.z.string().optional().describe('[deprecated] Typescript typings for the object'),
      title: sdk.z.string().optional(),
      searchable: sdk.z.boolean().optional().describe('Indicates if the field is vectorized and searchable.'),
      hidden: sdk.z.boolean().optional().describe('Indicates if the field is hidden in the UI'),
      order: sdk.z.number().optional().describe('Order of the column in the UI'),
      width: sdk.z.number().optional().describe('Width of the column in the UI'),
      schemaId: sdk.z.string().optional().describe('ID of the schema'),
      computed: sdk.z
        .object({
          action: sdk.z.enum(['ai', 'code', 'workflow']),
          dependencies: sdk.z.array(sdk.z.string()).default([]),
          prompt: sdk.z.string().optional().describe('Prompt when action is "ai"'),
          code: sdk.z.string().optional().describe('Code to execute when action is "code"'),
          model: sdk.z.string().max(80).default('gpt-4o').optional().describe('Model to use when action is "ai"'),
          workflowId: sdk.z.string().max(20).optional().describe('ID of Workflow to execute when action is "workflow"'),
          enabled: sdk.z.boolean().optional(),
        })
        .optional(),
    })
    .passthrough()
    .optional(),
  nullable: sdk.z.boolean().optional(),
  description: sdk.z.string().optional(),
  default: sdk.z.any().optional(),
}

const baseObjectSchema = sdk.z.object({}).passthrough()
const baseArraySchema = sdk.z.object({}).passthrough()

const baseSchemas = {
  string: sdk.z
    .object({
      type: sdk.z.literal('string'),
      format: sdk.z.string().optional(),
      pattern: sdk.z.string().optional(),
      enum: sdk.z.array(sdk.z.string()).optional(),
      minLength: sdk.z.number().optional(),
      maxLength: sdk.z.number().optional(),
    })
    .extend(commonProps),
  number: sdk.z
    .object({
      type: sdk.z.literal('number'),
      minimum: sdk.z.number().optional(),
      maximum: sdk.z.number().optional(),
    })
    .extend(commonProps),
  boolean: sdk.z
    .object({
      type: sdk.z.literal('boolean'),
    })
    .extend(commonProps),
  object: baseObjectSchema
    .extend({
      type: sdk.z.literal('object'),
      properties: sdk.z.record(baseObjectSchema).optional(),
      required: sdk.z.array(sdk.z.string()).optional(),
      additionalProperties: sdk.z.union([sdk.z.boolean(), sdk.z.object({}).passthrough()]).optional(),
    })
    .extend(commonProps),
  array: baseArraySchema
    .extend({
      type: sdk.z.literal('array'),
      items: baseArraySchema.optional(),
      minItems: sdk.z.number().optional(),
      maxItems: sdk.z.number().optional(),
    })
    .extend(commonProps),
  null: sdk.z.object({
    type: sdk.z.literal('null'),
  }),
}

export const columnSchema = sdk.z.discriminatedUnion('type', [
  baseSchemas.string,
  baseSchemas.number,
  baseSchemas.boolean,
  baseSchemas.object,
  baseSchemas.array,
  baseSchemas.null,
])

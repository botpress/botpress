import { z } from '@botpress/sdk'
import { tableSchema, recordSchema } from './sub-schemas'

export const getTableRecordsInputSchema = z.object({
  tableIdOrName: z
    .string()
    .describe('The ID or Name of the table (e.g. tblFnqcm4zLVKn85A or articles)')
    .title('Table ID or Name'),
  nextToken: z.string().optional().describe('The next page token (Optional)').title('Next Token'),
})

export const getTableRecordsOutputSchema = z.object({
  records: z.array(recordSchema).describe('Array of single record with field and cell values').title('Records'),
  nextToken: z.string().optional().describe('The next page token (Optional)').title('Next Token'),
})

export const listRecordsInputSchema = z.object({
  tableIdOrName: z
    .string()
    .describe('The ID or Name of the table (e.g. tblFnqcm4zLVKn85A or articles)')
    .title('Table ID or Name'),
  nextToken: z.string().optional().describe('The next page token (Optional)').title('Next Token'),
  filterByFormula: z
    .string()
    .optional()
    .describe('filter to apply to the list records (See https://support.airtable.com/docs/formula-field-reference)')
    .title('Filter By Formula'),
})

export const listRecordsOutputSchema = z
  .object({
    records: z.array(recordSchema).describe('Array of single record with field and cell values').title('Records'),
    nextToken: z.string().optional().describe('The next page token (Optional)').title('Next Token'),
  })
  .passthrough()

export const createTableInputSchema = z.object({
  name: z.string().describe('Name of the Table (e.g. MyTable)').title('Name'),
  fields: z
    .string()
    .describe(
      'The Table\'s fields, separated by commas. Each field should be in the format "type_name" (e.g. "phoneNumber_Customer Phone, singleLineText_Address").'
    )
    .title('Fields'),
  description: z
    .string()
    .optional()
    .describe('Description of the Table (e.g. This is my table) (Optional)')
    .title('Description'),
})

export const createTableOutputSchema = tableSchema.passthrough()

export const updateTableInputSchema = z.object({
  tableIdOrName: z
    .string()
    .describe('The ID or Name of the table (e.g. tblFnqcm4zLVKn85A or articles)')
    .title('Table ID or Name'),
  name: z.string().optional().describe('Name of the Table (e.g. MyTable) (Optional)').title('Name'),
  description: z
    .string()
    .optional()
    .describe('Description of the Table (e.g. This is my table) (Optional)')
    .title('Description'),
})

export const updateTableOutputSchema = tableSchema.passthrough()

export const createRecordInputSchema = z.object({
  tableIdOrName: z
    .string()
    .describe('The ID or Name of the table (e.g. tblFnqcm4zLVKn85A or articles)')
    .title('Table ID or Name'),
  fields: z
    .string()
    .describe(
      'The fields and their values for the new record, in a JSON format (e.g. {"Name":"John Doe","City":"In the moon","Verify":true})'
    )
    .title('Fields'),
})

export const createRecordOutputSchema = recordSchema.passthrough()

export const updateRecordInputSchema = z.object({
  tableIdOrName: z
    .string()
    .describe('The ID or Name of the table (e.g. tblFnqcm4zLVKn85A or articles)')
    .title('Table ID or Name'),
  recordId: z.string().describe('The ID of the Record to be updated').title('Record ID'),
  fields: z
    .string()
    .describe(
      'The fields and their values for the record to be updated, in a JSON format (e.g. {"Name":"John Doe","Verify":true})'
    )
    .title('Fields'),
})

export const updateRecordOutputSchema = recordSchema.passthrough()

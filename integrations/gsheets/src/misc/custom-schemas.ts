import z from 'zod'

export const getValuesInputSchema = z.object({
  range: z
    .string()
    .describe(
      'The A1 notation of the values to retrieve. (e.g. "Sheet1!A1:B2")'
    ),
})

export const getValuesOutputSchema = z
  .object({
    range: z.string().nullable(),
    majorDimension: z.string().nullable(),
  })
  .partial()
  .passthrough()

export const updateValuesInputSchema = z.object({
  range: z
    .string()
    .describe('The A1 notation of the values to update. (e.g. "Sheet1!A1:B2")'),
  values: z
    .string()
    .describe(
      'The values to write to the range. This is a JSON string that represents an array of arrays, where each inner array represents a row/s of data.'
    ),
})

export const updateValuesOutputSchema = z
  .object({
    spreadsheetId: z.string().nullable(),
    updatedRange: z.string().nullable(),
    updatedRows: z.number().nullable(),
    updatedColumns: z.number().nullable(),
    updatedCells: z.number().nullable(),
  })
  .partial()
  .passthrough()

export const appendValuesInputSchema = z.object({
  range: z
    .string()
    .describe(
      'The A1 notation of the range to append to. (e.g. "Sheet1!A1:B2")'
    ),
  values: z
    .string()
    .describe(
      'The values to write to the range. This is a JSON string that represents an array of arrays, where each inner array represents a row/s of data.'
    ),
})

export const appendValuesOutputSchema = z
  .object({
    spreadsheetId: z.string().nullable(),
  })
  .partial()
  .passthrough()

export const clearValuesInputSchema = z.object({
  range: z
    .string()
    .describe('The A1 notation of the range to clear. (e.g. "Sheet1!A1:B2")'),
})

export const clearValuesOutputSchema = z
  .object({
    spreadsheetId: z.string().nullable(),
    clearedRange: z.string().nullable(),
  })
  .partial()
  .passthrough()

export const batchUpdateInputSchema = z.object({
  requests: z
    .string()
    .describe(
      'The update requests to apply to the spreadsheet. This is a JSON string that represents an array of request objects as specified in the Google Sheets API documentation.'
    ),
})

export const batchUpdateOutputSchema = z
  .object({
    spreadsheetId: z.string().nullable(),
  })
  .partial()
  .passthrough()

export const getInfoSpreadsheetInputSchema = z.object({
  fields: z
    .string()
    .describe(
      'The fields to include in the response when retrieving spreadsheet properties and metadata. This is a comma-separated list of field names. (e.g. "spreadsheetId,properties.title,sheets.properties.sheetId,sheets.properties.title")'
    ),
})

export const getInfoSpreadsheetOutputSchema = z
  .object({
    spreadsheetId: z.string().nullable(),
  })
  .partial()
  .passthrough()

export const addSheetInputSchema = z.object({
  title: z
    .string()
    .describe('The title of the new sheet to add to the spreadsheet.'),
})

export const addSheetOutputSchema = z
  .object({
    spreadsheetId: z.string().nullable(),
  })
  .partial()
  .passthrough()

import * as sdk from '@botpress/sdk'
const { z } = sdk

type ActionDefinitions = NonNullable<sdk.IntegrationDefinition['actions']>
type ActionDef = ActionDefinitions[string]

const MAJOR_DIMENSION = ['ROWS', 'COLUMNS'] as const
export type MajorDimension = (typeof MAJOR_DIMENSION)[number]

const _sheetsValue = z
  .string()
  .title('Stringified value')
  .describe('Represents the value of a single cell. This is a stringified number, string or boolean value')

const _commonFields = {
  range: z.string().title('Range').placeholder("'Sheet name'!A1:F8"),
  majorDimension: z.enum(MAJOR_DIMENSION).title('Major Dimension').default('ROWS'),
  values: z
    .array(
      z
        .array(_sheetsValue)
        .title('Row or column')
        .describe('Represents a major dimension (a row or column) of a values range')
    )
    .title('Values'),
} as const

const getValues = {
  title: 'Get Values',
  description: 'Returns the values of a range in the spreadsheet.',
  input: {
    schema: z.object({
      range: _commonFields.range.describe('The A1 notation of the range to retrieve. (e.g. "Sheet1!A1:B2")'),
      majorDimension: _commonFields.majorDimension
        .optional()
        .describe(
          'If it equals "ROWS", then the values are returned as rows. If it equals "COLUMNS", then the values are returned as columns.'
        ),
    }),
  },
  output: {
    schema: z
      .object({
        range: _commonFields.range
          .nullable()
          .describe(
            'The range the values cover, in A1 notation. This range indicates the entire requested range, even though the values will exclude trailing rows and columns. (e.g. "Sheet1!A1:B2")'
          ),
        majorDimension: _commonFields.majorDimension
          .nullable()
          .describe(
            'If it equals "ROWS", then the values are returned in rows. If it equals "COLUMNS", then the values are returned in columns.'
          ),
        values: _commonFields.values
          .nullable()
          .describe(
            'The data that was read. This is an array of arrays, the outer array representing all the data and each inner array representing a major dimension (a row or column). Each item in the inner array corresponds with one cell. (e.g. [["a", "b"], ["c", "d"]])'
          ),
      })
      .partial(),
  },
} as const satisfies ActionDef

const updateValues = {
  title: 'Update Values',
  description: 'Sets values in a range in the spreadsheet.',
  input: {
    schema: z.object({
      range: _commonFields.range.describe('The A1 notation of the range to update. (e.g. "Sheet1!A1:B2")'),
      majorDimension: _commonFields.majorDimension
        .optional()
        .describe(
          'If it equals "ROWS", then the values are inserted as rows. If it equals "COLUMNS", then the values are inserted as columns.'
        ),
      values: _commonFields.values.describe(
        'The values to write to the range. This is an array of arrays, where each inner array represents a major dimension (a row or column) of data. (e.g. [["a", "b"], ["c", "d"]])'
      ),
    }),
  },
  output: {
    schema: z
      .object({
        spreadsheetId: z
          .string()
          .title('Spreadsheet ID')
          .nullable()
          .describe('The spreadsheet the updates were applied to.'),
        updatedRange: z
          .string()
          .title('Updated Range')
          .nullable()
          .describe('The range (in A1 notation) that updates were applied to.'),
        updatedRows: z
          .number()
          .title('Updated Rows')
          .nullable()
          .describe('The number of rows where at least one cell in the row was updated.'),
        updatedColumns: z
          .number()
          .title('Updated Columns')
          .nullable()
          .describe('The number of columns where at least one cell in the column was updated.'),
        updatedCells: z.number().title('Updated Cells').nullable().describe('The number of cells updated.'),
      })
      .partial(),
  },
} as const satisfies ActionDef

const appendValues = {
  title: 'Append Values',
  description:
    'Appends values to the spreadsheet. The input range is used to search for existing data and find a "table" within that range. Values will be appended to the next row of the table, starting with the first column of the table.',
  input: {
    schema: z.object({
      range: _commonFields.range.describe(
        'The A1 notation of a range to search for a logical table of data. Values are appended after the last row of the table. (e.g. "Sheet1!A1:B2")'
      ),
      majorDimension: _commonFields.majorDimension
        .optional()
        .describe(
          'If it equals "ROWS", then the values are inserted as rows. If it equals "COLUMNS", then the values are inserted as columns.'
        ),
      values: _commonFields.values.describe(
        'The values to write to the range. This is an array of arrays, where each inner array represents a major dimension (a row or column) of data. (e.g. [["a", "b"], ["c", "d"]])'
      ),
    }),
  },
  output: {
    schema: z
      .object({
        spreadsheetId: z
          .string()
          .title('Spreadsheet ID')
          .nullable()
          .describe('The spreadsheet the updates were applied to.'),
      })
      .partial(),
  },
} as const satisfies ActionDef

const clearValues = {
  title: 'Clear Values',
  description:
    'Clears values from a spreadsheet. Only values are cleared; all other properties of the cell (such as formatting, data validation, etc..) are kept.',
  input: {
    schema: z.object({
      range: _commonFields.range.describe('The A1 notation of the range to clear. (e.g. "Sheet1!A1:B2")'),
    }),
  },
  output: {
    schema: z
      .object({
        spreadsheetId: z
          .string()
          .title('Spreadsheet ID')
          .nullable()
          .describe('The spreadsheet the updates were applied to.'),
        clearedRange: z
          .string()
          .title('Cleared Range')
          .nullable()
          .describe('The range (in A1 notation) that was cleared.'),
      })
      .partial(),
  },
} as const satisfies ActionDef

const getInfoSpreadsheet = {
  title: 'Get Info of a SpreadSheet',
  description: 'Returns the properties and metadata of the specified spreadsheet.',
  input: {
    schema: z.object({
      fields: z
        .array(z.string().title('Field name').describe('The field to include in the response'))
        .title('Fields')
        .describe(
          'The fields to include in the response when retrieving spreadsheet properties and metadata. This is a list of field names. (eg. spreadsheetId, properties.title, sheets.properties.sheetId, sheets.properties.title)'
        ),
      properties: z.any().optional().title('Properties').describe('The properties of the spreadsheet.'),
    }),
  },
  output: {
    schema: z
      .object({
        spreadsheetId: z.string().title('Spreadsheet ID').nullable().describe('The spreadsheet ID.'),
        spreadsheetUrl: z.string().title('Spreadsheet URL').nullable().describe('The URL of the spreadsheet.'),
        dataSources: z.array(z.any()).title('Data Sources').describe('The data sources connected to the spreadsheet.'),
        dataSourceSchedules: z
          .array(z.any())
          .title('Data Source Schedules')
          .describe('The schedules of the data sources.'),
        developerMetadata: z
          .array(z.any())
          .title('Developer Metadata')
          .describe('The developer metadata associated with the spreadsheet.'),
        namedRanges: z.array(z.any()).title('Named Ranges').describe('The named ranges defined in the spreadsheet.'),
        properties: z.any().title('Properties').describe('The properties of the spreadsheet.'),
        sheets: z.array(z.any()).title('Sheets').describe('The sheets present in the spreadsheet.'),
      })
      .partial(),
  },
} as const satisfies ActionDef

const addSheet = {
  title: 'Add Sheet',
  description: 'Adds a new sheet to the spreadsheet.',
  input: {
    schema: z.object({
      title: z.string().title('Title').describe('The title of the new sheet to add to the spreadsheet.'),
    }),
  },
  output: {
    schema: z
      .object({
        spreadsheetId: z.string().title('Spreadsheet ID').nullable().describe('The spreadsheet ID of the new sheet.'),
      })
      .partial(),
  },
} as const satisfies ActionDef

export const actions = {
  getValues,
  updateValues,
  appendValues,
  clearValues,
  getInfoSpreadsheet,
  addSheet,
} as const satisfies ActionDefinitions

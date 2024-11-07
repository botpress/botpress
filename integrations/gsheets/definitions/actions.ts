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
    schema: z.object({
      range: _commonFields.range.describe(
        'The range the values cover, in A1 notation. This range indicates the entire requested range, even though the values will exclude trailing rows and columns. (e.g. "Sheet1!A1:B2")'
      ),
      majorDimension: _commonFields.majorDimension.describe(
        'If it equals "ROWS", then the values are returned in rows. If it equals "COLUMNS", then the values are returned in columns.'
      ),
      values: _commonFields.values.describe(
        'The data that was read. This is an array of arrays, the outer array representing all the data and each inner array representing a major dimension (a row or column). Each item in the inner array corresponds with one cell. (e.g. [["a", "b"], ["c", "d"]])'
      ),
    }),
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
    schema: z.object({
      spreadsheetId: z.string().title('Spreadsheet ID').describe('The spreadsheet the updates were applied to.'),
      updatedRange: z
        .string()
        .title('Updated Range')
        .describe('The range (in A1 notation) that updates were applied to.'),
      updatedRows: z
        .number()
        .title('Updated Rows')
        .describe('The number of rows where at least one cell in the row was updated.'),
      updatedColumns: z
        .number()
        .title('Updated Columns')
        .describe('The number of columns where at least one cell in the column was updated.'),
      updatedCells: z.number().title('Updated Cells').describe('The number of cells updated.'),
    }),
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
    schema: z.object({
      spreadsheetId: z.string().title('Spreadsheet ID').describe('The spreadsheet the updates were applied to.'),
    }),
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
    schema: z.object({
      spreadsheetId: z.string().title('Spreadsheet ID').describe('The spreadsheet the updates were applied to.'),
      clearedRange: z.string().title('Cleared Range').describe('The range (in A1 notation) that was cleared.'),
    }),
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
    schema: z.object({
      spreadsheetId: z.string().title('Spreadsheet ID').describe('The spreadsheet ID of the new sheet.'),
      newSheet: z
        .object({
          sheetId: z.number().title('Sheet ID').describe('The ID of the new sheet.'),
          title: z.string().title('Title').describe('The title of the new sheet.'),
          index: z.number().title('Index').describe('The index of the new sheet within the spreadsheet.'),
          isHidden: z.boolean().title('Is Hidden').describe('Whether the new sheet is hidden.'),
        })
        .title('New Sheet')
        .describe('The new sheet that was added to the spreadsheet.'),
    }),
  },
} as const satisfies ActionDef

const deleteSheet = {
  title: 'Delete Sheet',
  description: 'Deletes a sheet from the spreadsheet.',
  input: {
    schema: z.object({
      sheetId: z.number().title('Sheet ID').describe('The ID of the sheet to delete.'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} as const satisfies ActionDef

const renameSheet = {
  title: 'Rename Sheet',
  description: 'Renames a sheet in the spreadsheet.',
  input: {
    schema: z.object({
      sheetId: z.number().title('Sheet ID').describe('The ID of the sheet to rename.'),
      newTitle: z.string().title('New Title').describe('The new title of the sheet.'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} as const satisfies ActionDef

const getAllSheetsInSpreadsheet = {
  title: 'Get All Sheets in Spreadsheet',
  description: 'Returns all sheets in the spreadsheet.',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      sheets: z
        .array(
          z.object({
            sheetId: z.number().title('Sheet ID').describe('The ID of the sheet.'),
            title: z.string().title('Title').describe('The name of the sheet.'),
            index: z.number().title('Index').describe('The index of the sheet within the spreadsheet.'),
            isHidden: z.boolean().title('Is Hidden').describe('Whether the sheet is hidden.'),
            hasProtectedRanges: z
              .boolean()
              .title('Has Protected Ranges')
              .describe('Whether the sheet has protected ranges.'),
            isFullyProtected: z.boolean().title('Is Protected').describe('Whether the entire sheet is protected.'),
          })
        )
        .title('Sheets')
        .describe('The sheets present in the spreadsheet.'),
    }),
  },
} as const satisfies ActionDef

const setSheetVisibility = {
  title: 'Set Sheet Visibility',
  description: 'Sets the visibility of a sheet in the spreadsheet.',
  input: {
    schema: z.object({
      sheetId: z.number().title('Sheet ID').describe('The ID of the sheet to set visibility.'),
      isHidden: z.boolean().title('Is Hidden').describe('Whether the sheet is hidden.'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} as const satisfies ActionDef

const moveSheetHorizontally = {
  title: 'Move Sheet Horizontally',
  description: 'Moves a sheet to a new index in the spreadsheet.',
  input: {
    schema: z.object({
      sheetId: z.number().title('Sheet ID').describe('The ID of the sheet to move.'),
      newIndex: z.number().title('New Index').describe('The new index of the sheet within the spreadsheet.'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} as const satisfies ActionDef

const protectNamedRange = {
  title: 'Protect Named Range',
  description: 'Creates a protected range from a named range, preventing modification.',
  input: {
    schema: z.object({
      namedRangeId: z.string().title('Named Range ID').describe('The ID of the named range to protect.'),
      warningOnly: z
        .boolean()
        .title('Warning Only')
        .optional()
        .describe('Whether the protection displays a warning but still allows editing.'),
      requestingUserCanEdit: z
        .boolean()
        .title('Requesting User Can Edit')
        .optional()
        .describe('Whether the user adding the protection can edit the protected range.'),
    }),
  },
  output: {
    schema: z.object({
      protectedRangeId: z.number().title('Protected Range ID').describe('The ID of the new protected range.'),
    }),
  },
} as const satisfies ActionDef

const getNamedRanges = {
  title: 'Get Named Ranges',
  description: 'Returns all named ranges in the spreadsheet.',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      namedRanges: z
        .array(
          z.object({
            namedRangeId: z.string().title('Named Range ID').describe('The ID of the named range.'),
            name: z.string().title('Name').describe('The name of the named range.'),
            range: _commonFields.range.describe('The range of the named range in A1 notation. (e.g. "A1:B2")'),
            sheetId: z.number().title('Sheet ID').describe('The ID of the sheet the named range applies to.'),
          })
        )
        .title('Named Ranges')
        .describe('The named ranges defined in the spreadsheet.'),
    }),
  },
} as const satisfies ActionDef

const getProtectedRanges = {
  title: 'Get Protected Ranges',
  description: 'Returns all protected ranges in the spreadsheet.',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      protectedRanges: z
        .array(
          z.object({
            protectedRangeId: z.number().title('Protected Range ID').describe('The ID of the protected range.'),
            namedRangeId: z
              .string()
              .title('Named Range ID')
              .describe('The ID of the named range, if the protected range is backed by a named range.'),
            range: _commonFields.range.describe('The range of the protected range in A1 notation. (e.g. "A1:B2")'),
            sheetId: z.number().title('Sheet ID').describe('The ID of the sheet the protected range applies to.'),
            description: z.string().title('Description').describe('The description of the protected range.'),
            warningOnly: z
              .boolean()
              .title('Warning Only')
              .describe('Whether the protection displays a warning but still allows editing.'),
            requestingUserCanEdit: z
              .boolean()
              .title('Requesting User Can Edit')
              .describe('Whether the user adding the protection can edit the protected range.'),
          })
        )
        .title('Protected Ranges')
        .describe('The protected ranges defined in the spreadsheet.'),
    }),
  },
} as const satisfies ActionDef

const unprotectRange = {
  title: 'Unprotect Range',
  description: 'Removes protection from a protected range in the spreadsheet.',
  input: {
    schema: z.object({
      protectedRangeId: z.number().title('Protected Range ID').describe('The ID of the protected range to unprotect.'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} as const satisfies ActionDef

const createNamedRangeInSheet = {
  title: 'Create Named Range in Sheet',
  description: 'Creates a named range in a sheet.',
  input: {
    schema: z.object({
      sheetId: z.number().title('Sheet ID').describe('The ID of the sheet to create the named range in.'),
      rangeName: z.string().title('Name').describe('The name of the named range.'),
      rangeA1: _commonFields.range.describe(
        'The A1 notation of the range to associate with the named range. (e.g. "Sheet1!A1:B2")'
      ),
    }),
  },
  output: {
    schema: z.object({
      namedRangeId: z.string().title('Named Range ID').describe('The ID of the new named range.'),
    }),
  },
} as const satisfies ActionDef

export const actions = {
  addSheet,
  appendValues,
  clearValues,
  createNamedRangeInSheet,
  deleteSheet,
  getAllSheetsInSpreadsheet,
  getInfoSpreadsheet,
  getNamedRanges,
  getProtectedRanges,
  getValues,
  moveSheetHorizontally,
  protectNamedRange,
  renameSheet,
  setSheetVisibility,
  unprotectRange,
  updateValues,
} as const satisfies ActionDefinitions

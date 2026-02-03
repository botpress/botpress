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

const setValues = {
  title: 'Set Values',
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
    'Appends values to the spreadsheet. The input startColumn is used to search for existing data and find a "table" within that range. Values will be appended to the next row of the table, starting with the first column of the table.',
  input: {
    schema: z.object({
      sheetName: z
        .string()
        .title('Sheet Name')
        .optional()
        .describe('The name of the sheet (e.g. "Sheet1"). If not provided, the first visible sheet is used.'),
      startColumn: z
        .string()
        .title('Start Column')
        .describe(
          'The start column letter(s) (e.g. "A", "B", "AA"). The range will be constructed from this column row 1 to column row 100000.'
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
      tableRange: z
        .string()
        .title('Table Range')
        .describe(
          'The range (in A1 notation) of the table that values are being appended to (before the values were appended). Empty if no table was found.'
        ),
      updates: z
        .object({
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
        })
        .title('Updates')
        .describe('The updates that were applied to the spreadsheet.'),
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
    schema: z.object({
      spreadsheetId: z
        .union([z.string(), z.null()])
        .title('Spreadsheet ID')
        .describe('The unique identifier of the spreadsheet.')
        .optional(),
      spreadsheetUrl: z
        .union([z.string(), z.null()])
        .title('Spreadsheet URL')
        .describe('The URL of the spreadsheet.')
        .optional(),
      dataSources: z
        .array(z.any())
        .describe('The data sources connected to the spreadsheet.')
        .title('Data Sources')
        .optional(),
      dataSourceSchedules: z
        .array(z.any())
        .describe('The schedules of the data sources.')
        .title('Data Source Schedules')
        .optional(),
      developerMetadata: z
        .array(z.any())
        .describe('The developer metadata associated with the spreadsheet.')
        .title('Developer Metadata')
        .optional(),
      namedRanges: z
        .array(z.any())
        .describe('The named ranges defined in the spreadsheet.')
        .title('Named Ranges')
        .optional(),
      properties: z.any().describe('The properties of the spreadsheet.').title('Properties').optional(),
      sheets: z.array(z.any()).describe('The sheets present in the spreadsheet.').title('Sheets').optional(),
    }),
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

const _rowSchema = z
  .object({
    rowIndex: z.number().title('Row Index').describe('The 1-based index of the row in the sheet.'),
    values: z.array(z.string().title('Cell Value')).title('Values').describe('The cell values in the row.'),
  })
  .title('Row')
  .describe('A row with its index and values.')

const findRows = {
  title: 'Find Rows',
  description:
    'Search for rows where a specific column matches a value. Returns all matching rows with their indexes. Handles empty sheets and no matches gracefully by returning an empty array.',
  input: {
    schema: z.object({
      sheetName: z
        .string()
        .title('Sheet Name')
        .optional()
        .describe('The name of the sheet (e.g. "Sheet1"). If not provided, the first visible sheet is used.'),
      searchColumn: z.string().title('Search Column').describe('The column letter to search in (e.g. "A", "B", "AA").'),
      searchValue: z.string().title('Search Value').describe('The value to search for in the specified column.'),
      dataRange: z
        .string()
        .title('Data Range')
        .optional()
        .describe(
          'Optional A1 notation range to limit the search (e.g. "A1:F100"). If not provided, searches the entire sheet.'
        ),
    }),
  },
  output: {
    schema: z.object({
      rows: z.array(_rowSchema).title('Matching Rows').describe('The rows that match the search criteria.'),
      totalMatches: z.number().title('Total Matches').describe('The total number of matching rows found.'),
    }),
  },
} as const satisfies ActionDef

const findRow = {
  title: 'Find Row (First Match)',
  description:
    'Search for the first row where a specific column matches a value. Returns the row data and its index, or null if no match is found.',
  input: {
    schema: z.object({
      sheetName: z
        .string()
        .title('Sheet Name')
        .optional()
        .describe('The name of the sheet (e.g. "Sheet1"). If not provided, the first visible sheet is used.'),
      searchColumn: z.string().title('Search Column').describe('The column letter to search in (e.g. "A", "B", "AA").'),
      searchValue: z.string().title('Search Value').describe('The value to search for in the specified column.'),
      dataRange: z
        .string()
        .title('Data Range')
        .optional()
        .describe(
          'Optional A1 notation range to limit the search (e.g. "A1:F100"). If not provided, searches the entire sheet.'
        ),
    }),
  },
  output: {
    schema: z.object({
      found: z.boolean().title('Found').describe('Whether a matching row was found.'),
      row: _rowSchema.nullable().describe('The first matching row, or null if not found.'),
    }),
  },
} as const satisfies ActionDef

const getRow = {
  title: 'Get Row',
  description: 'Fetch a specific row by its 1-based index. Provides direct row access without A1 notation math.',
  input: {
    schema: z.object({
      sheetName: z
        .string()
        .title('Sheet Name')
        .optional()
        .describe('The name of the sheet (e.g. "Sheet1"). If not provided, the first visible sheet is used.'),
      rowIndex: z
        .number()
        .title('Row Index')
        .describe('The 1-based row index to retrieve (e.g. 1 for the first row, 2 for the second row).'),
      startColumn: z
        .string()
        .title('Start Column')
        .optional()
        .default('A')
        .describe('The starting column letter (e.g. "A"). Defaults to "A".'),
      endColumn: z
        .string()
        .title('End Column')
        .optional()
        .describe('The ending column letter (e.g. "Z"). If not provided, returns all columns with data.'),
    }),
  },
  output: {
    schema: z.object({
      found: z.boolean().title('Found').describe('Whether the row exists and has data.'),
      row: _rowSchema.nullable().describe('The row data, or null if the row is empty or does not exist.'),
    }),
  },
} as const satisfies ActionDef

const updateRow = {
  title: 'Update Row',
  description:
    'Update a specific row by its 1-based index with a partial or complete set of values. Only the provided values are updated.',
  input: {
    schema: z.object({
      sheetName: z
        .string()
        .title('Sheet Name')
        .optional()
        .describe('The name of the sheet (e.g. "Sheet1"). If not provided, the first visible sheet is used.'),
      rowIndex: z.number().title('Row Index').describe('The 1-based row index to update.'),
      values: z
        .array(z.string().title('Cell Value'))
        .title('Values')
        .describe('The values to write to the row, starting from the start column.'),
      startColumn: z
        .string()
        .title('Start Column')
        .optional()
        .default('A')
        .describe('The starting column letter for the update (e.g. "A"). Defaults to "A".'),
    }),
  },
  output: {
    schema: z.object({
      updatedRange: z.string().title('Updated Range').describe('The range (in A1 notation) that was updated.'),
      updatedCells: z.number().title('Updated Cells').describe('The number of cells updated.'),
    }),
  },
} as const satisfies ActionDef

const insertRowAtIndex = {
  title: 'Insert Row at Index',
  description: 'Insert a new row at a specific 1-based index. Existing rows at and below the index are shifted down.',
  input: {
    schema: z.object({
      sheetName: z
        .string()
        .title('Sheet Name')
        .optional()
        .describe('The name of the sheet (e.g. "Sheet1"). If not provided, the first visible sheet is used.'),
      rowIndex: z.number().title('Row Index').describe('The 1-based index where the new row should be inserted.'),
      values: z
        .array(z.string().title('Cell Value'))
        .title('Values')
        .optional()
        .describe('Optional values to populate the new row.'),
      startColumn: z
        .string()
        .title('Start Column')
        .optional()
        .default('A')
        .describe('The starting column letter for the values (e.g. "A"). Defaults to "A".'),
    }),
  },
  output: {
    schema: z.object({
      insertedRowIndex: z.number().title('Inserted Row Index').describe('The 1-based index of the newly inserted row.'),
    }),
  },
} as const satisfies ActionDef

const deleteRows = {
  title: 'Delete Rows',
  description:
    'Delete one or more rows by their 1-based indexes. Rows are deleted in reverse order to preserve indexes during deletion.',
  input: {
    schema: z.object({
      sheetName: z
        .string()
        .title('Sheet Name')
        .optional()
        .describe('The name of the sheet (e.g. "Sheet1"). If not provided, the first visible sheet is used.'),
      rowIndexes: z
        .array(z.number().title('Row Index'))
        .title('Row Indexes')
        .describe('The 1-based row indexes to delete.'),
    }),
  },
  output: {
    schema: z.object({
      deletedCount: z.number().title('Deleted Count').describe('The number of rows deleted.'),
    }),
  },
} as const satisfies ActionDef

const upsertRow = {
  title: 'Upsert Row',
  description:
    'Update a row if it exists (based on a key column match), or append a new row if no match is found. Useful for maintaining unique records.',
  input: {
    schema: z.object({
      sheetName: z
        .string()
        .title('Sheet Name')
        .optional()
        .describe('The name of the sheet (e.g. "Sheet1"). If not provided, the first visible sheet is used.'),
      keyColumn: z
        .string()
        .title('Key Column')
        .describe('The column letter to use for matching (e.g. "A" for ID column).'),
      keyValue: z.string().title('Key Value').describe('The value to match in the key column.'),
      values: z.array(z.string().title('Cell Value')).title('Values').describe('The values to write to the row.'),
      startColumn: z
        .string()
        .title('Start Column')
        .optional()
        .default('A')
        .describe('The starting column letter for the values (e.g. "A"). Defaults to "A".'),
    }),
  },
  output: {
    schema: z.object({
      action: z.enum(['updated', 'inserted']).title('Action').describe('Whether the row was updated or inserted.'),
      rowIndex: z.number().title('Row Index').describe('The 1-based index of the affected row.'),
    }),
  },
} as const satisfies ActionDef

export const actions = {
  addSheet,
  appendValues,
  clearValues,
  createNamedRangeInSheet,
  deleteRows,
  deleteSheet,
  findRow,
  findRows,
  getAllSheetsInSpreadsheet,
  getInfoSpreadsheet,
  getNamedRanges,
  getProtectedRanges,
  getRow,
  getValues,
  insertRowAtIndex,
  moveSheetHorizontally,
  protectNamedRange,
  renameSheet,
  setSheetVisibility,
  unprotectRange,
  updateRow,
  upsertRow,
  setValues,
} as const satisfies ActionDefinitions

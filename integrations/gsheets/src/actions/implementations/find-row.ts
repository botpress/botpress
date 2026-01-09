import { wrapAction } from '../action-wrapper'
import { buildSheetPrefix, columnLetterToIndex } from './row-utils'

export const findRow = wrapAction(
  { actionName: 'findRow', errorMessageWhenFailed: 'Failed to find row' },
  async ({ googleClient }, { sheetName, searchColumn, searchValue, dataRange }) => {
    const { sheetTitle } = await googleClient.getSheetIdByName(sheetName)
    const prefix = buildSheetPrefix(sheetTitle)

    const rangeA1 = dataRange ? `${prefix}${dataRange.split('!').pop()}` : `${prefix}A:ZZ`

    let values: string[][] = []
    try {
      const result = await googleClient.getValuesFromSpreadsheetRange({ rangeA1, majorDimension: 'ROWS' })
      values = result.values ?? []
    } catch {
      return { found: false, row: null }
    }

    if (values.length === 0) {
      return { found: false, row: null }
    }

    const searchColumnIndex = columnLetterToIndex(searchColumn)

    for (let i = 0; i < values.length; i++) {
      const row = values[i] ?? []
      const cellValue = row[searchColumnIndex] ?? ''

      if (cellValue === searchValue) {
        return {
          found: true,
          row: {
            rowIndex: i + 1,
            values: row.map(String),
          },
        }
      }
    }

    return { found: false, row: null }
  }
)

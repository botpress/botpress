import { wrapAction } from '../action-wrapper'
import { buildSheetPrefix, columnLetterToIndex } from './row-utils'

export const findRows = wrapAction(
  { actionName: 'findRows', errorMessageWhenFailed: 'Failed to find rows' },
  async ({ googleClient }, { sheetName, searchColumn, searchValue, dataRange }) => {
    const { sheetTitle } = await googleClient.getSheetIdByName(sheetName)
    const prefix = buildSheetPrefix(sheetTitle)

    const rangeA1 = dataRange ? `${prefix}${dataRange.split('!').pop()}` : `${prefix}A:ZZ`

    let values: string[][] = []
    try {
      const result = await googleClient.getValuesFromSpreadsheetRange({ rangeA1, majorDimension: 'ROWS' })
      values = result.values ?? []
    } catch {
      return { rows: [], totalMatches: 0 }
    }

    if (values.length === 0) {
      return { rows: [], totalMatches: 0 }
    }

    const searchColumnIndex = columnLetterToIndex(searchColumn)
    const rows: Array<{ rowIndex: number; values: string[] }> = []

    for (const [i, row] of values.entries()) {
      const rowValues = row ?? []
      const cellValue = rowValues[searchColumnIndex] ?? ''

      if (cellValue === searchValue) {
        rows.push({
          rowIndex: i + 1,
          values: rowValues.map(String),
        })
      }
    }

    return {
      rows,
      totalMatches: rows.length,
    }
  }
)

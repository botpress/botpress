import { wrapAction } from '../action-wrapper'
import { buildSheetPrefix, buildRowRange, columnLetterToIndex, indexToColumnLetter } from './row-utils'

export const upsertRow = wrapAction(
  { actionName: 'upsertRow', errorMessageWhenFailed: 'Failed to upsert row' },
  async ({ googleClient }, { sheetName, keyColumn, keyValue, values, startColumn }) => {
    const { sheetTitle } = await googleClient.getSheetIdByName(sheetName)
    const prefix = buildSheetPrefix(sheetTitle)

    const rangeA1 = `${prefix}A:ZZ`

    let existingValues: string[][] = []
    try {
      const result = await googleClient.getValuesFromSpreadsheetRange({ rangeA1, majorDimension: 'ROWS' })
      existingValues = result.values ?? []
    } catch {
      existingValues = []
    }

    const keyColumnIndex = columnLetterToIndex(keyColumn)
    let matchingRowIndex: number | null = null

    for (const [i, row] of existingValues.entries()) {
      const rowValues = row ?? []
      const cellValue = rowValues[keyColumnIndex] ?? ''

      if (cellValue === keyValue) {
        matchingRowIndex = i + 1
        break
      }
    }

    const start = startColumn ?? 'A'
    const startColIndex = columnLetterToIndex(start)
    const endColIndex = startColIndex + values.length - 1
    const endColumn = indexToColumnLetter(endColIndex)

    if (matchingRowIndex !== null) {
      const updateRangeA1 = buildRowRange({
        sheetTitle,
        rowIndex: matchingRowIndex,
        startColumn: start,
        endColumn,
      })

      await googleClient.updateValuesInSpreadsheetRange({
        rangeA1: updateRangeA1,
        values: [values],
        majorDimension: 'ROWS',
      })

      return {
        action: 'updated' as const,
        rowIndex: matchingRowIndex,
      }
    }

    const appendRangeA1 = `${prefix}${start}:${endColumn}`

    const appendResult = await googleClient.appendValuesToSpreadsheetRange({
      rangeA1: appendRangeA1,
      values: [values],
      majorDimension: 'ROWS',
    })

    const updatedRange = appendResult.updates.updatedRange
    const rowMatch = updatedRange.match(/:?[A-Z]+(\d+)$/)
    const insertedRowIndex = rowMatch?.[1] ? parseInt(rowMatch[1], 10) : existingValues.length + 1

    return {
      action: 'inserted' as const,
      rowIndex: insertedRowIndex,
    }
  }
)

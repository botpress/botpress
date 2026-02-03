import { wrapAction } from '../action-wrapper'
import { buildRowRange, indexToColumnLetter, columnLetterToIndex } from './row-utils'

export const updateRow = wrapAction(
  { actionName: 'updateRow', errorMessageWhenFailed: 'Failed to update row' },
  async ({ googleClient }, { sheetName, rowIndex, values, startColumn }) => {
    const { sheetTitle } = await googleClient.getSheetIdByName(sheetName)

    const start = startColumn ?? 'A'
    const startColIndex = columnLetterToIndex(start)
    const endColIndex = startColIndex + values.length - 1
    const endColumn = indexToColumnLetter(endColIndex)

    const rangeA1 = buildRowRange({
      sheetTitle,
      rowIndex,
      startColumn: start,
      endColumn,
    })

    const result = await googleClient.updateValuesInSpreadsheetRange({
      rangeA1,
      values: [values],
      majorDimension: 'ROWS',
    })

    return {
      updatedRange: result.updatedRange,
      updatedCells: result.updatedCells,
    }
  }
)

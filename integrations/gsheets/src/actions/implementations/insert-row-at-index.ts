import { wrapAction } from '../action-wrapper'
import { buildRowRange, indexToColumnLetter, columnLetterToIndex } from './row-utils'

export const insertRowAtIndex = wrapAction(
  { actionName: 'insertRowAtIndex', errorMessageWhenFailed: 'Failed to insert row at index' },
  async ({ googleClient }, { sheetName, rowIndex, values, startColumn }) => {
    const { sheetId, sheetTitle } = await googleClient.getSheetIdByName(sheetName)

    await googleClient.insertRows({
      sheetId,
      startIndex: rowIndex - 1,
      numberOfRows: 1,
    })

    if (values && values.length > 0) {
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

      await googleClient.updateValuesInSpreadsheetRange({
        rangeA1,
        values: [values],
        majorDimension: 'ROWS',
      })
    }

    return {
      insertedRowIndex: rowIndex,
    }
  }
)

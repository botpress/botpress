import { wrapAction } from '../action-wrapper'
import { buildRowRange } from './row-utils'

export const getRow = wrapAction(
  { actionName: 'getRow', errorMessageWhenFailed: 'Failed to get row' },
  async ({ googleClient }, { sheetName, rowIndex, startColumn, endColumn }) => {
    const { sheetTitle } = await googleClient.getSheetIdByName(sheetName)

    const rangeA1 = buildRowRange({
      sheetTitle,
      rowIndex,
      startColumn: startColumn ?? 'A',
      endColumn,
    })

    let values: string[][] = []
    try {
      const result = await googleClient.getValuesFromSpreadsheetRange({ rangeA1, majorDimension: 'ROWS' })
      values = result.values ?? []
    } catch {
      return { found: false, row: null }
    }

    if (values.length === 0 || !values[0] || values[0].length === 0) {
      return { found: false, row: null }
    }

    return {
      found: true,
      row: {
        rowIndex,
        values: values[0].map(String),
      },
    }
  }
)

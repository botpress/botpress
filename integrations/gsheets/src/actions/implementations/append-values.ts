import { wrapAction } from '../action-wrapper'
import { constructRangeFromStartColumn } from './append-values-utils'

export const appendValues = wrapAction(
  { actionName: 'appendValues', errorMessageWhenFailed: 'Failed to append values into spreadsheet' },
  async ({ googleClient }, { sheetName, startColumn, values, majorDimension }) =>
    await googleClient.appendValuesToSpreadsheetRange({
      rangeA1: constructRangeFromStartColumn(sheetName, startColumn),
      values,
      majorDimension,
    })
)

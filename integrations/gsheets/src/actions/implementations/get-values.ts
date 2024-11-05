import { wrapAction } from '../action-wrapper'

export const getValues = wrapAction(
  { actionName: 'getValues', errorMessageWhenFailed: 'Failed to get values from the specified range' },
  async ({ input, googleClient }) => {
    const response = await googleClient.getValuesFromSpreadsheetRange({
      rangeA1: input.range,
      majorDimension: input.majorDimension,
    })

    return {
      ...response,
      majorDimension: (response.majorDimension === 'COLUMNS' ? 'COLUMNS' : 'ROWS') as 'COLUMNS' | 'ROWS',
    }
  }
)

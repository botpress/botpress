export const getValuesUi = {
  range: {
    title: 'The A1 notation of the values to retrieve. (e.g. "Sheet1!A1:B2")',
  },
}

export const clearValuesUi = {
  range: {
    title: 'The A1 notation of the values to retrieve. (e.g. "Sheet1!A1:B2")',
  },
}

export const getInfoSpreadsheetUi = {
  fields: {
    title:
      'The fields to include in the response when retrieving spreadsheet properties and metadata. This is a comma-separated list of field names. (e.g. "spreadsheetId,properties.title,sheets.properties.sheetId,sheets.properties.title")',
  },
}

export const addSheetUi = {
  title: {
    title: 'The title of the new sheet to add to the spreadsheet.',
  },
}

export const updateValuesUi = {
  range: {
    title: 'The A1 notation of the values to retrieve. (e.g. "Sheet1!A1:B2")',
  },
  values: {
    title:
      'The values to write to the range. This is an array of arrays, where each inner array represents a row/s of data.',
  },
}

export const appendValuesUi = {
  range: {
    title: 'The A1 notation of the values to retrieve. (e.g. "Sheet1!A1:B2")',
  },
  values: {
    title:
      'The values to write to the range. This is an array of arrays, where each inner array represents a row/s of data.',
  },
}

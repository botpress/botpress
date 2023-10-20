import {
  addSheetInputSchema,
  addSheetOutputSchema,
  appendValuesInputSchema,
  appendValuesOutputSchema,
  clearValuesInputSchema,
  clearValuesOutputSchema,
  getInfoSpreadsheetInputSchema,
  getInfoSpreadsheetOutputSchema,
  getValuesInputSchema,
  getValuesOutputSchema,
  updateValuesInputSchema,
  updateValuesOutputSchema,
} from '../misc/custom-schemas'

import {
  addSheetUi,
  appendValuesUi,
  clearValuesUi,
  getInfoSpreadsheetUi,
  getValuesUi,
  updateValuesUi,
} from '../misc/custom-uis'

const getValues = {
  title: 'Get Values',
  input: {
    schema: getValuesInputSchema,
    ui: getValuesUi,
  },
  output: {
    schema: getValuesOutputSchema,
  },
}

const updateValues = {
  title: 'Update Values',
  input: {
    schema: updateValuesInputSchema,
    ui: updateValuesUi,
  },
  output: {
    schema: updateValuesOutputSchema,
  },
}

const appendValues = {
  title: 'Append Values',
  input: {
    schema: appendValuesInputSchema,
    ui: appendValuesUi,
  },
  output: {
    schema: appendValuesOutputSchema,
  },
}

const clearValues = {
  title: 'Clear Values',
  input: {
    schema: clearValuesInputSchema,
    ui: clearValuesUi,
  },
  output: {
    schema: clearValuesOutputSchema,
  },
}

const getInfoSpreadsheet = {
  title: 'Get Info of a SpreadSheet',
  input: {
    schema: getInfoSpreadsheetInputSchema,
    ui: getInfoSpreadsheetUi,
  },
  output: {
    schema: getInfoSpreadsheetOutputSchema,
  },
}

const addSheet = {
  title: 'Add Sheet',
  input: {
    schema: addSheetInputSchema,
    ui: addSheetUi,
  },
  output: {
    schema: addSheetOutputSchema,
  },
}

export const actions = {
  getValues,
  updateValues,
  appendValues,
  clearValues,
  getInfoSpreadsheet,
  addSheet,
}

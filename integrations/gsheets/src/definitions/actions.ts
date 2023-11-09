import {
  ActionDefinitions,
  addSheetInputSchema,
  addSheetOutputSchema,
  appendValuesInputSchema,
  appendValuesOutputSchema,
  clearValuesInputSchema,
  clearValuesOutputSchema,
  getInfoInputSchema,
  getInfoOutputSchema,
  getValuesInputSchema,
  getValuesOutputSchema,
  updateValuesInputSchema,
  updateValuesOutputSchema,
} from '../misc/custom-schemas'

import { addSheetUi, appendValuesUi, clearValuesUi, getInfoUi, getValuesUi, updateValuesUi } from '../misc/custom-uis'

type ActionDef = ActionDefinitions[string]

const getValues = {
  title: 'Get Values',
  input: {
    schema: getValuesInputSchema,
    ui: getValuesUi,
  },
  output: {
    schema: getValuesOutputSchema,
  },
} satisfies ActionDef

const updateValues = {
  title: 'Update Values',
  input: {
    schema: updateValuesInputSchema,
    ui: updateValuesUi,
  },
  output: {
    schema: updateValuesOutputSchema,
  },
} satisfies ActionDef

const appendValues = {
  title: 'Append Values',
  input: {
    schema: appendValuesInputSchema,
    ui: appendValuesUi,
  },
  output: {
    schema: appendValuesOutputSchema,
  },
} satisfies ActionDef

const clearValues = {
  title: 'Clear Values',
  input: {
    schema: clearValuesInputSchema,
    ui: clearValuesUi,
  },
  output: {
    schema: clearValuesOutputSchema,
  },
} satisfies ActionDef

const getInfoSpreadsheet = {
  title: 'Get Info of a SpreadSheet',
  input: {
    schema: getInfoInputSchema,
    ui: getInfoUi,
  },
  output: {
    schema: getInfoOutputSchema,
  },
} satisfies ActionDef

const addSheet = {
  title: 'Add Sheet',
  input: {
    schema: addSheetInputSchema,
    ui: addSheetUi,
  },
  output: {
    schema: addSheetOutputSchema,
  },
} satisfies ActionDef

export const actions = {
  getValues,
  updateValues,
  appendValues,
  clearValues,
  getInfoSpreadsheet,
  addSheet,
} satisfies ActionDefinitions

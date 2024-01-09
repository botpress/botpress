import {
  createRecordInputSchema,
  createRecordOutputSchema,
  createTableInputSchema,
  createTableOutputSchema,
  getTableRecordsInputSchema,
  getTableRecordsOutputSchema,
  updateRecordInputSchema,
  updateRecordOutputSchema,
  updateTableInputSchema,
  updateTableOutputSchema,
} from '../misc/custom-schemas'

import {
  createRecordUi,
  createTableUi,
  getTableRecordsUi,
  updateRecordUi,
  updateTableUi,
} from '../misc/custom-uis'

const getTableRecords = {
  title: 'Get Records of the Table',
  input: {
    schema: getTableRecordsInputSchema,
    ui: getTableRecordsUi,
  },
  output: {
    schema: getTableRecordsOutputSchema,
  },
}

const createTable = {
  title: 'Create Table',
  input: {
    schema: createTableInputSchema,
    ui: createTableUi,
  },
  output: {
    schema: createTableOutputSchema,
  },
}

const updateTable = {
  title: 'Update Table',
  input: {
    schema: updateTableInputSchema,
    ui: updateTableUi,
  },
  output: {
    schema: updateTableOutputSchema,
  },
}

const createRecord = {
  title: 'Create Record',
  input: {
    schema: createRecordInputSchema,
    ui: createRecordUi,
  },
  output: {
    schema: createRecordOutputSchema,
  },
}

const updateRecord = {
  title: 'Update Record',
  input: {
    schema: updateRecordInputSchema,
    ui: updateRecordUi,
  },
  output: {
    schema: updateRecordOutputSchema,
  },
}

export const actions = {
  getTableRecords,
  createTable,
  updateTable,
  createRecord,
  updateRecord,
}

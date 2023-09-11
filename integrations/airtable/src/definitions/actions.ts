import {
  createRecordInputSchema,
  createRecordOutputSchema,
  createTableInputSchema,
  createTableOutputSchema,
  getBaseTablesInputSchema,
  getBaseTablesOutputSchema,
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
  getBaseTablesUi,
  getTableRecordsUi,
  updateRecordUi,
  updateTableUi,
} from '../misc/custom-uis'

const getBaseTables = {
  title: 'Get Tables of the Base',
  input: {
    schema: getBaseTablesInputSchema,
    ui: getBaseTablesUi,
  },
  output: {
    schema: getBaseTablesOutputSchema,
  },
}

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
  getBaseTables,
  getTableRecords,
  createTable,
  updateTable,
  createRecord,
  updateRecord,
}

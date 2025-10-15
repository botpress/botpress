import { listRecords, createRecord, updateRecord } from './record'
import { createTable, getTableRecords, updateTable, listBases, listTables } from './table'
import * as bp from '.botpress'

export default {
  listBases,
  listTables,
  getTableRecords,
  createTable,
  updateTable,
  listRecords,
  createRecord,
  updateRecord,
} as const satisfies bp.IntegrationProps['actions']

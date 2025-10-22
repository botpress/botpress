import { createRecord, listRecords, updateRecord } from './record'
import { createTable, getTableRecords, updateTable } from './table'
import * as bp from '.botpress'

export default {
  getTableRecords,
  createTable,
  updateTable,
  createRecord,
  updateRecord,
  listRecords,
} as const satisfies bp.IntegrationProps['actions']

import { listRecords, getRecord, createRecord, updateRecord } from './record'
import { listObjects, getObject, listAttributes } from './objects'
import * as bp from '.botpress'

export default {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  listObjects,
  getObject,
  listAttributes,
} as const satisfies bp.IntegrationProps['actions']
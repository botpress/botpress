import { listObjects, getObject, listAttributes } from './objects'
import { listRecords, getRecord, createRecord, updateRecord } from './record'
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

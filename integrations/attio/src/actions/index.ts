import { listRecords, getRecord, createRecord, updateRecord } from './record'
import * as bp from '.botpress'

export default { listRecords, getRecord, createRecord, updateRecord } as const satisfies bp.IntegrationProps['actions']
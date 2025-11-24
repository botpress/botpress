import { exportZodSchemas } from '@bpinternal/opapi'
import _ from 'lodash'
import { chatApi } from './api'
import { createOperations } from './operations'
import { signalSchemas } from './signals'
import { apiVersion } from './version'

export { messagePayloadSchema } from './models/message'

export const api = chatApi()
const _operations = createOperations(api)

for (const op of _.values(_operations)) {
  api.addOperation(op)
}

export const version = apiVersion
export const signals = {
  exportSchemas: exportZodSchemas(signalSchemas),
}

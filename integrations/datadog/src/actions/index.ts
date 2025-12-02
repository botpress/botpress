import { createEvent } from './implementations/create-event'
import { queryMetrics } from './implementations/query-metrics'
import * as bp from '.botpress'

export const actions = {
  queryMetrics,
  createEvent,
} as const satisfies bp.IntegrationProps['actions']


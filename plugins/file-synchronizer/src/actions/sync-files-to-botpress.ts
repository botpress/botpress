import { v4 } from 'uuid'
import { SYNC_IMMEDIATE_DELAY_MS } from '../consts'
import * as bp from '.botpress'

export const callAction: bp.AnyActionHandler = async ({ client }) => {
  // Schedule a manual sync:
  await client.createEvent({
    type: 'scheduledSync',
    payload: {
      syncId: v4(),
      syncType: 'manual',
      syncInitiatedAt: new Date().toISOString(),
    },
    schedule: { delay: SYNC_IMMEDIATE_DELAY_MS },
  })

  return {}
}

import * as bp from '.botpress'
import { SYNC_IMMEDIATE_DELAY_MS } from '../consts'
import { v4 } from 'uuid'

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

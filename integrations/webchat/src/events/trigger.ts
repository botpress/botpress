import { triggerSchema } from '../misc/messaging/incoming-event'
import { Client } from '../misc/types'
import * as bp from '.botpress'

type Events = bp.events.Events

export const handleTrigger = async ({
  userId,
  conversationId,
  client,
  payload,
}: {
  userId: string
  conversationId: string
  client: Client
  payload: any
}) => {
  const triggerParse = triggerSchema.safeParse(payload)
  if (triggerParse.success) {
    await client.createEvent({
      type: 'trigger',
      payload: {
        origin: 'website',
        userId,
        conversationId,
        payload: triggerParse.data.payload,
      } satisfies Events['trigger'],
    })

    return true
  }

  return false
}

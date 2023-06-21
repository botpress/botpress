import { Client } from '@botpress/client'

import { triggerSchema } from '../misc/messaging/incoming-event'
import { Events } from '.botpress/implementation/events'

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

import { z } from '@botpress/sdk'
import * as bp from '.botpress'

export const EndConversationReasonSchema = z.enum(['UNKNOWN' , 'INVALID_SESSION' , 'AGENT_ENDED' , 'VISITOR_ENDED' , 'CRITICAL_ERROR', 'POLLING_SERVER_FAILED']).or(z.string())

export type EndConversationReason = z.output<typeof EndConversationReasonSchema>

export const executeConversationEnded = async ({
  botpressConversationId,
  botpressUserId,
  client,
  reason = 'UNKNOWN'
}: {
  botpressConversationId: string
  botpressUserId: string
  client: bp.Client
  reason?: EndConversationReason
}) => {
  await client.createEvent({
    type: 'onConversationEnded',
    payload: {
      botpressConversationId,
      botpressUserId,
      reason
    },
  })
}

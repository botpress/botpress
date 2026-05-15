import { hitlStoppedBodySchema } from './schemas'
import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeHitlStopped = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body, logger } = props
  const log = logger.forBot()

  const parsed = hitlStoppedBodySchema.safeParse(body)
  if (!parsed.success) {
    log.warn(`hitlStopped webhook has invalid payload: ${parsed.error.message}`)
    return
  }

  const { ticket } = parsed.data

  try {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: { freshdeskTicketId: String(ticket.id) },
    })

    await client.createEvent({
      type: 'hitlStopped',
      payload: { conversationId: conversation.id },
    })
  } catch (thrown) {
    log.error(
      `hitlStopped failed for ticket=${ticket.id}: ${thrown instanceof Error ? thrown.message : String(thrown)}`
    )
  }
}

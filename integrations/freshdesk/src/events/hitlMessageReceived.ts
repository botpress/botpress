import { isHitlTicket } from '../hitl'
import { getOrCreateAgentUser } from './agent'
import { hitlMessageReceivedBodySchema } from './schemas'
import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeHitlMessageReceived = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body, logger } = props
  const log = logger.forBot()

  const parsed = hitlMessageReceivedBodySchema.safeParse(body)
  if (!parsed.success) {
    log.warn(`hitlMessageReceived webhook has invalid payload: ${parsed.error.message}`)
    return
  }

  const { ticket, reply, note, agent } = parsed.data
  const text = note?.body_text ?? reply?.body_text

  if (!isHitlTicket(ticket)) {
    log.debug(`hitlMessageReceived: ticket=${ticket.id} is not marked as a Botpress HITL ticket, ignoring`)
    return
  }

  if (!text) {
    log.debug('hitlMessageReceived: empty message body, ignoring')
    return
  }

  try {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: { freshdeskTicketId: String(ticket.id) },
    })

    const { user } = await getOrCreateAgentUser({ agent, client, ticketId: ticket.id })

    await client.createMessage({
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text },
      tags: {},
    })

    log.info(`hitlMessageReceived: created message in conversation=${conversation.id} from agent=${user.id}`)
  } catch (thrown) {
    log.error(
      `hitlMessageReceived failed for ticket=${ticket.id}: ${thrown instanceof Error ? thrown.message : String(thrown)}`
    )
  }
}

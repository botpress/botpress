import { isHitlTicket } from '../hitl'
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

  const { ticket, reply, agent } = parsed.data
  const text = reply.body_text

  if (!isHitlTicket(ticket)) {
    log.debug(`hitlMessageReceived: ticket=${ticket.id} is not marked as a Botpress HITL ticket, ignoring`)
    return
  }

  if (!text) {
    log.debug('hitlMessageReceived: empty reply body, ignoring')
    return
  }

  try {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: { freshdeskTicketId: String(ticket.id) },
    })

    const { messages } = await client.listMessages({
      conversationId: conversation.id,
      tags: { freshdeskCommentId: reply.id },
    })
    if (messages.length > 0) {
      log.debug(`hitlMessageReceived: duplicate reply detected for ticket=${ticket.id}, reply=${reply.id}, skipping`)
      return
    }

    const agentId = agent?.id ?? 'unknown'
    const agentName = agent?.name ?? 'Freshdesk Agent'
    const { users } = await client.listUsers({ tags: { freshdeskAgentId: agentId } })
    const { user } = users[0]
      ? await client.updateUser({ ...users[0], name: agentName, tags: { ...users[0].tags, freshdeskAgentId: agentId } })
      : await client.createUser({ name: agentName, tags: { freshdeskAgentId: agentId } })

    await client.createMessage({
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text },
      tags: { freshdeskCommentId: reply.id },
    })

    log.info(`hitlMessageReceived: created message in conversation=${conversation.id} from agent=${agentId}`)
  } catch (thrown) {
    log.error(
      `hitlMessageReceived failed for ticket=${ticket.id}: ${thrown instanceof Error ? thrown.message : String(thrown)}`
    )
  }
}

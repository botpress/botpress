import { isHitlTicket } from '../hitl'
import { hitlAssignedBodySchema } from './schemas'
import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeHitlAssigned = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body, logger } = props
  const log = logger.forBot()

  const parsed = hitlAssignedBodySchema.safeParse(body)
  if (!parsed.success) {
    log.warn(`hitlAssigned webhook has invalid payload: ${parsed.error.message}`)
    return
  }

  const { ticket, agent } = parsed.data

  if (!isHitlTicket(ticket)) {
    log.debug(`hitlAssigned: ticket=${ticket.id} is not marked as a Botpress HITL ticket, ignoring`)
    return
  }

  try {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: { freshdeskTicketId: String(ticket.id) },
    })

    const agentId = agent?.id ?? 'unknown'
    const agentName = agent?.name ?? 'Freshdesk Agent'
    const { users } = await client.listUsers({ tags: { freshdeskAgentId: agentId } })
    const { user } = users[0]
      ? await client.updateUser({ ...users[0], name: agentName, tags: { ...users[0].tags, freshdeskAgentId: agentId } })
      : await client.createUser({ name: agentName, tags: { freshdeskAgentId: agentId } })

    await client.createEvent({
      type: 'hitlAssigned',
      payload: { conversationId: conversation.id, userId: user.id },
    })
  } catch (thrown) {
    log.error(
      `hitlAssigned failed for ticket=${ticket.id}: ${thrown instanceof Error ? thrown.message : String(thrown)}`
    )
  }
}

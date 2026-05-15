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
  const text = reply.body_text.trim()

  if (!text) {
    log.debug('hitlMessageReceived: empty reply body, ignoring')
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

    // Deduplicate: skip if a message with identical text is already the most recent in this conversation
    const { messages } = await client.listMessages({ conversationId: conversation.id })
    if (messages.length > 0 && messages[0]?.payload?.['text'] === text) {
      log.debug(`hitlMessageReceived: duplicate message detected for ticket=${ticket.id}, skipping`)
      return
    }

    await client.createMessage({
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text },
      tags: {},
    })

    log.info(`hitlMessageReceived: created message in conversation=${conversation.id} from agent=${agentId}`)
  } catch (thrown) {
    log.error(
      `hitlMessageReceived failed for ticket=${ticket.id}: ${thrown instanceof Error ? thrown.message : String(thrown)}`
    )
  }
}

import { hitlMessageReceivedBodySchema } from './schemas'
import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

const extractPlainText = (raw: string): string => {
  let text = raw
  // Freshdesk sometimes prepends "Agent Name : " before the HTML body — strip only that prefix
  text = text.replace(/^[^<]+:\s*(?=<)/, '')
  if (!/<[a-z]/i.test(text)) {
    return text.trim()
  }
  // Strip HTML: convert <br> to newlines, remove all other tags, decode entities, clean whitespace
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/​/g, '') // zero-width space Freshdesk sometimes injects
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const executeHitlMessageReceived = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body, logger } = props
  const log = logger.forBot()

  const parsed = hitlMessageReceivedBodySchema.safeParse(body)
  if (!parsed.success) {
    log.warn(`hitlMessageReceived webhook has invalid payload: ${parsed.error.message}`)
    return
  }

  const { ticket, reply, agent } = parsed.data
  const text = extractPlainText(reply.body_text)

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

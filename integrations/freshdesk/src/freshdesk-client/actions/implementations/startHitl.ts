import { buildConversationTranscript } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { HITL_TICKET_TAG } from '../../../hitl'
import { FreshdeskClient } from '../../FreshdeskClient'
import { createFreshdeskRuntimeError } from '../errors'
import * as bp from '.botpress'

const PRIORITY_MAP: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 }

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, input, client, logger }) => {
  const log = logger.forBot()
  try {
    const chatbotName = input.hitlSession?.chatbotName ?? 'Botpress'

    const { user } = await client.getUser({ id: input.userId })

    const description = input.description?.trim() || `Someone opened a ticket using your ${chatbotName} chatbot.`
    const messageHistory = await buildConversationTranscript({ client, ctx, messages: input.messageHistory })
    const ticketDescription = description + (messageHistory.length ? `\n\n---\n\n${messageHistory}` : '')

    const freshdeskClient = new FreshdeskClient(ctx.configuration.domain, ctx.configuration.apiKey)

    const requesterFields = input.hitlSession?.requesterName
      ? {
          name: input.hitlSession.requesterName,
          ...(input.hitlSession.requesterEmail ? { email: input.hitlSession.requesterEmail } : {}),
        }
      : user.tags.freshdeskRequesterId
        ? { requester_id: parseInt(user.tags.freshdeskRequesterId, 10) }
        : (() => {
            throw new sdk.RuntimeError(
              `User ${user.id} has no freshdeskRequesterId tag and no requesterName was provided. ` +
                'Call createUser first or pass requesterName/requesterEmail in the hitlSession.'
            )
          })()

    const ticket = await freshdeskClient.createTicket({
      subject: input.title ?? 'Support Request',
      description: ticketDescription,
      ...requesterFields,
      ...(input.hitlSession?.priority ? { priority: PRIORITY_MAP[input.hitlSession.priority] } : {}),
      ...(input.hitlSession?.groupId ? { group_id: parseInt(input.hitlSession.groupId, 10) } : {}),
      tags: Array.from(new Set([HITL_TICKET_TAG, ...(input.hitlSession?.tags ?? [])])),
    })

    log.info(`Created Freshdesk ticket id=${ticket.id} for HITL session`)

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: { freshdeskTicketId: String(ticket.id) },
    })

    return { conversationId: conversation.id }
  } catch (thrown) {
    if (thrown instanceof sdk.RuntimeError) throw thrown
    log.warn('startHitl failed', { error: thrown instanceof Error ? thrown.message : String(thrown) })
    throw createFreshdeskRuntimeError(thrown)
  }
}

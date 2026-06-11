import * as sdk from '@botpress/sdk'
import { FreshdeskClient } from '../../FreshdeskClient'
import { createFreshdeskRuntimeError } from '../errors'
import * as bp from '.botpress'

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ input, client, ctx, logger }) => {
  const log = logger.forBot()
  try {
    const { conversation } = await client.getConversation({ id: input.conversationId })
    const ticketId = conversation.tags.freshdeskTicketId
    if (!ticketId) {
      log.warn(`Conversation ${input.conversationId} has no freshdeskTicketId tag, skipping stopHitl`)
      return {}
    }

    await new FreshdeskClient(ctx.configuration.domain, ctx.configuration.apiKey).updateTicket({
      id: parseInt(ticketId, 10),
      status: 4, // resolved
    })

    log.info(`Resolved Freshdesk ticket id=${ticketId}`)
    return {}
  } catch (thrown) {
    if (thrown instanceof sdk.RuntimeError) throw thrown
    log.warn('stopHitl failed', { error: thrown instanceof Error ? thrown.message : String(thrown) })
    throw createFreshdeskRuntimeError(thrown)
  }
}

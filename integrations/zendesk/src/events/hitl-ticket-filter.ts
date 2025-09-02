import * as sdk from '@botpress/sdk'
import type { TriggerPayload } from '../triggers'
import type * as bp from '.botpress'

export const retrieveHitlConversation = async ({
  zendeskTrigger,
  client,
  ctx,
  logger,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}) => {
  if (!zendeskTrigger.externalId?.length) {
    logger.forBot().debug('No external ID associated with the Zendesk ticket. Ignoring the ticket...', {
      zendeskTicketId: zendeskTrigger.ticketId,
    })
    return
  }

  if (!ctx.configuration.ignoreNonHitlTickets) {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: { id: zendeskTrigger.ticketId },
    })

    return conversation
  }

  try {
    const { conversation } = await client.getConversation({ id: zendeskTrigger.externalId })

    if (conversation.channel !== 'hitl') {
      logger.forBot().debug('Ignoring the ticket since it was not created by the startHitl action', {
        conversation,
        zendeskTicketId: zendeskTrigger.ticketId,
      })
      return
    }

    return conversation
  } catch (thrown: unknown) {
    if (sdk.isApiError(thrown) && thrown.code === 404) {
      logger.forBot().debug('Ignoring the ticket since it does not refer to a Botpress conversation', {
        zendeskTicketId: zendeskTrigger.ticketId,
      })
      return
    }

    throw thrown
  }
}

import { getZendeskClient } from './client'
import { articlePublished } from './events/article-published'
import { articleUnpublished } from './events/article-unpublished'
import { executeMessageReceived } from './events/message-received'
import { executeTicketAssigned } from './events/ticket-assigned'
import { executeTicketSolved } from './events/ticket-solved'
import type { TriggerPayload } from './triggers'
import { ZendeskEvent } from './webhookEvents'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  if (req.path === '/article-event' && req.method === 'POST') {
    const event: ZendeskEvent = JSON.parse(req.body)

    logger.forBot().info('Received event of type: ' + event.type)

    switch (event.type) {
      case 'zen:event-type:article.published':
        await articlePublished({ event, client, ctx, logger })
        break
      case 'zen:event-type:article.unpublished':
        await articleUnpublished({ event, client, ctx, logger })
        break
      default:
        logger.forBot().warn('Unsupported event type: ' + event.type)
        break
    }

    return
  }

  const zendeskClient = getZendeskClient(ctx.configuration)
  const trigger = JSON.parse(req.body)
  const zendeskTrigger = trigger as TriggerPayload

  switch (zendeskTrigger.type) {
    case 'newMessage':
      return await executeMessageReceived({ zendeskClient, zendeskTrigger, client, ctx, logger })
    case 'ticketAssigned':
      return await executeTicketAssigned({ zendeskTrigger, client, ctx, logger })
    case 'ticketSolved':
      await executeMessageReceived({ zendeskClient, zendeskTrigger, client, ctx, logger })
      return await executeTicketSolved({ zendeskTrigger, client, ctx, logger })

    default:
      logger.forBot().warn('Unsupported trigger type: ' + zendeskTrigger.type)
      break
  }
}

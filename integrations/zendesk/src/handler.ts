import { getZendeskClient } from './client'
import { articlePublished } from './events/article-published'
import { articleUnpublished } from './events/article-unpublished'
import { executeTicketAssigned } from './events/ticket-assigned'
import { executeTicketSolved } from './events/ticket-solved'
import type { TriggerPayload } from './triggers'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  try {
    await client.uploadFile({
      key: 'test.html',
      content: 'Test content',
      tags: {
        source: 'knowledge-base',
        kbId: 'kb-df417d3355',
      },
    })
  } catch (e) {
    console.log(e)
    console.log('error uploaded file')
  }

  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  const zendeskClient = getZendeskClient(ctx.configuration)
  const trigger = JSON.parse(req.body)
  const zendeskTrigger = trigger as TriggerPayload

  switch (zendeskTrigger.type) {
    case 'newMessage':
      const { conversation } = await client.getOrCreateConversation({
        channel: 'ticket',
        tags: {
          id: zendeskTrigger.ticketId,
        },
      })

      if (!zendeskTrigger.currentUser.externalId?.length) {
        const { user: newUser } = await client.getOrCreateUser({
          tags: {
            id: zendeskTrigger.currentUser.id,
            name: zendeskTrigger.currentUser.name,
            email: zendeskTrigger.currentUser.email,
            role: zendeskTrigger.currentUser.role,
          },
        })

        await zendeskClient.updateUser(zendeskTrigger.currentUser.id, {
          external_id: newUser.id,
        })
      }

      const { user } = await client.getOrCreateUser({
        tags: {
          id: zendeskTrigger.currentUser.id,
        },
      })

      const messageWithoutAuthor = zendeskTrigger.comment.split('\n').slice(3).join('\n')

      await client.createMessage({
        tags: { origin: 'zendesk' },
        type: 'text',
        userId: user.id,
        conversationId: conversation.id,
        payload: { text: messageWithoutAuthor },
      })

      return

    case 'ticketAssigned':
      return await executeTicketAssigned({ zendeskTrigger, client })
    case 'ticketSolved':
      return await executeTicketSolved({ zendeskTrigger, client })

    case 'zen:event-type:article.published':
      await articlePublished({ zendeskTrigger, client, ctx, logger })
      break

    case 'zen:event-type:article.unpublished':
      await articleUnpublished({ zendeskTrigger, client, logger })
      break

    default:
      logger.forBot().warn('Unsupported trigger type: ' + zendeskTrigger.type)
      break
  }
}

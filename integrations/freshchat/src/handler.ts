import { FreshchatEvent } from './definitions/freshchat-events'
import { executeConversationAssignment } from './events/conversationAssignment'
import { executeConversationResolution } from './events/conversationResolution'
import { executeMessageCreate } from './events/messageCreate'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ ctx, req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  logger.forBot().debug('Handler received request from Freshchat with payload:', req.body)

  //https://crmsupport.freshworks.com/en/support/solutions/articles/50000004461-freshchat-webhooks-payload-structure-and-authentication
  const freshchatEvent = JSON.parse(req.body) as FreshchatEvent<any>

  switch (freshchatEvent.action) {
    case 'message_create':
      await executeMessageCreate({ freshchatEvent, client })
      break
    case 'conversation_assignment':
      await executeConversationAssignment({ freshchatEvent, client, ctx, logger })
      break
    case 'conversation_resolution':
      await executeConversationResolution({ freshchatEvent, client })
      break
    default:
      logger.forBot().warn('Invalid Freshchat event of type: ' + freshchatEvent.action)
  }
}

import { RuntimeError } from '@botpress/sdk'
import { getHitlClient } from './client'
import * as bp from '.botpress'

export const channels: bp.IntegrationProps['channels'] = {
  hitl: {
    messages: {
      text: async ({ ctx, client, conversation, logger, payload }) => {
        const hitlClient = getHitlClient(ctx, client, logger)

        const userId = conversation.tags.userId
        const integrationThreadId = conversation.tags.integrationThreadId
        const inboxId = conversation.tags.inboxId

        if (!userId) {
          logger.forBot().error('No userId found in conversation tags for HITL channel')
          throw new RuntimeError('Missing userId in conversation tags')
        }

        if (!integrationThreadId) {
          logger.forBot().error('No integrationThreadId found in conversation tags for HITL channel')
          throw new RuntimeError('Missing integrationThreadId in conversation tags')
        }

        if (!inboxId) {
          logger.forBot().error('No inboxId found in conversation tags for HITL channel')
          throw new RuntimeError('Missing inboxId in conversation tags')
        }

        const {
          state: { payload: userInfo },
        } = await client.getState({ id: userId, name: 'hitlUserInfo', type: 'user' })

        if (!userInfo?.contactIdentifier) {
          throw new RuntimeError('User identifier not found in hitlUserInfo state')
        }

        const {
          state: { payload: channelInfo },
        } = await client.getState({ id: ctx.integrationId, name: 'hitlConfig', type: 'integration' })

        const channelAccountId = channelInfo?.channelAccounts?.[inboxId]
        if (!channelAccountId) {
          throw new RuntimeError(`No channel account found for inbox ${inboxId}`)
        }

        const { name, contactIdentifier } = userInfo

        await hitlClient.sendMessage(
          payload.text,
          name,
          contactIdentifier,
          integrationThreadId,
          channelInfo.channelId,
          channelAccountId
        )
      },
      image: async ({ logger }) => {
        logger.forBot().warn('Image messages are not supported in the HubSpot HITL channel')
      },
      video: async ({ logger }) => {
        logger.forBot().warn('Video messages are not supported in the HubSpot HITL channel')
      },
      audio: async ({ logger }) => {
        logger.forBot().warn('Audio messages are not supported in the HubSpot HITL channel')
      },
      file: async ({ logger }) => {
        logger.forBot().warn('File messages are not supported in the HubSpot HITL channel')
      },
      bloc: async ({ logger }) => {
        logger.forBot().warn('Bloc messages are not supported in the HubSpot HITL channel')
      },
    },
  },
}

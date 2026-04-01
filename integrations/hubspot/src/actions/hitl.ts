import { RuntimeError } from '@botpress/sdk'
import { randomUUID } from 'crypto'
import { getHitlClient } from '../hitl/client'
import * as bp from '.botpress'

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, input, logger }) => {
  try {
    const { name = 'Unknown', email, pictureUrl } = input

    if (!email || !email.trim()) {
      throw new RuntimeError('An identifier (email or phone number) is required for HITL user creation.')
    }

    const trimmedIdentifier = email.trim()
    const isEmail = trimmedIdentifier.includes('@')
    const contactType = isEmail ? ('email' as const) : ('phone' as const)

    const userTags: Record<string, string> = { contactType }
    if (isEmail) {
      userTags.email = trimmedIdentifier
    } else {
      userTags.phoneNumber = trimmedIdentifier
    }

    const { user: botpressUser } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: userTags,
    })

    await client.setState({
      id: botpressUser.id,
      type: 'user',
      name: 'hitlUserInfo',
      payload: {
        name,
        contactIdentifier: trimmedIdentifier,
        contactType,
      },
    })

    logger.forBot().debug(`createUser: created/found user ${botpressUser.id} (${contactType})`)

    return { userId: botpressUser.id }
  } catch (error: any) {
    throw new RuntimeError(error.message)
  }
}

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, logger, input }) => {
  const hitlClient = getHitlClient(ctx, client, logger)

  try {
    const { userId, title, description = 'No description available' } = input

    const {
      state: { payload: userInfo },
    } = await client.getState({ id: userId, name: 'hitlUserInfo', type: 'user' })

    if (!userInfo?.contactIdentifier) {
      throw new RuntimeError('User identifier not found. Please ensure the user is created with createUser first.')
    }

    const {
      state: { payload: channelInfo },
    } = await client.getState({ id: ctx.integrationId, name: 'hitlChannelInfo', type: 'integration' })

    if (!channelInfo?.channelId) {
      throw new RuntimeError(
        'HITL channel not configured. Please ensure enableHitl is enabled and the integration is registered.'
      )
    }

    const { name, contactIdentifier } = userInfo
    const { channelId, channelAccountId } = channelInfo
    const integrationThreadId = randomUUID()

    const result = await hitlClient.createConversation(
      channelId,
      channelAccountId,
      integrationThreadId,
      name,
      contactIdentifier,
      title || 'New Support Request',
      description
    )

    const hubspotConversationId = result.data.conversationsThreadId
    logger.forBot().debug(`startHitl: HubSpot conversation ID: ${hubspotConversationId}`)

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: hubspotConversationId,
        userId,
        integrationThreadId,
      },
    })

    logger.forBot().debug(`startHitl: Botpress conversation ID: ${conversation.id}`)

    return { conversationId: conversation.id }
  } catch (error: any) {
    logger.forBot().error(`startHitl error: ${error.message}`)
    throw new RuntimeError(error.message)
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({}) => {
  return {}
}

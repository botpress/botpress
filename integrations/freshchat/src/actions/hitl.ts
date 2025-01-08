import { RuntimeError } from '@botpress/client'
import { getFreshchatClient } from 'src/client'
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, input, logger }) => {
  try {
    const freshchatClient = getFreshchatClient({ ...ctx.configuration }, logger)

    const { user } = await client.getUser({
      // Retrieve the user ID created in the createUser action
      id: input.userId,
    })

    if (!user.tags.id?.length) {
      throw new RuntimeError("Input user doesn't have a Freshchat User Id")
    }

    const { title, description, messageHistory } = input

    const {
      state: {
        payload: { channelId },
      },
    } = await client.getState({
      type: 'integration',
      id: ctx.integrationId,
      name: 'freshchat',
    })

    const messages = [
      {
        message_parts: [
          {
            text: {
              content: `New Conversation Started

              Title: ${title}
              Description: ${description}
            `,
            },
          },
        ],
        channel_id: channelId,
        message_type: 'normal',
        actor_type: 'user',
        actor_id: user.tags.id,
      },
    ]

    messages.push({
      message_parts: [
        {
          text: {
            content: `Transcript:
            ${
              messageHistory
                ?.map((message) => {
                  let text = ''

                  if (message.type !== 'text') {
                    text = `(Event: ${message.type})`
                  } else {
                    text = message.payload.text
                  }

                  const origin =
                    message.source.type === 'bot' ? 'Bot: ' : message.source.userId === user.id ? 'User: ' : ''

                  return `${origin}${text}`
                })
                .join('\n') || '-'
            }
          `,
          },
        },
      ],
      channel_id: channelId,
      message_type: 'normal',
      actor_type: 'user',
      actor_id: user.tags.id,
    })

    const freshchatConversation = await freshchatClient.createConversation({
      userId: user.tags.id as string,
      messages,
      channelId,
    })

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: `${freshchatConversation.conversation_id}`,
      },
    })

    return {
      conversationId: conversation.id,
    }
  } catch (error: any) {
    logger.forBot().error('Error Starting Freshchat Hitl: ' + error.message, error?.response?.data)
    throw new RuntimeError(error.message)
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, input, client, logger }) => {
  const { conversation } = await client.getConversation({
    id: input.conversationId,
  })

  const freshchatConversationId: string | undefined = conversation.tags.id

  if (!freshchatConversationId) {
    return {}
  }

  const freshchatClient = getFreshchatClient({ ...ctx.configuration }, logger)

  void freshchatClient.sendMessage(
    null,
    freshchatConversationId,
    'Botpress HITL terminated with reason: ' + input.reason
  )

  return {}
}

// create a user in both platforms
export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, input, ctx, logger }) => {
  try {
    const freshchatClient = getFreshchatClient({ ...ctx.configuration }, logger)

    const { name, email, pictureUrl } = input

    if (!email) {
      logger.forBot().error('Email necessary for HITL')
      throw new RuntimeError('Email necessary for HITL')
    }

    let freshchatUser = await freshchatClient.getUserByEmail(email)

    // Create a user on the agent handoff platform
    if (!freshchatUser) {
      logger.forBot().info(`User with email ${email} not Found on Freshchat, creating a new one`)

      freshchatUser = await freshchatClient.createUser({
        email,
        first_name: name,
        reference_id: email,
      })
    }

    if (!freshchatUser.id) {
      logger.forBot().error('Failed to create/get Freshchat User')
      throw new RuntimeError('Failed to create/get Freshchat User')
    }

    // Create a user on Botpress
    const { user: botpressUser } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: {
        // Link the Botpress user with the user on the agent handoff platform
        id: freshchatUser.id,
      },
    })

    return {
      userId: botpressUser.id, // always return the newly created botpress user id
    }
  } catch (error: any) {
    throw new RuntimeError(error.message)
  }
}

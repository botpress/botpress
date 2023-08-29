import type { Implementation } from '../misc/types'
import { createConversationInputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'

export const createConversation: Implementation['actions']['createConversation'] =
  async ({ ctx, input, logger }) => {
    const validatedInput = createConversationInputSchema.parse(input)
    const ZensunClient = getClient(ctx.configuration)
    const userExternalId = ctx.botUserId
    const defaultAgentContextInfo = `Agent Context [UserId: ${userExternalId} - Subject: ${
      validatedInput.displayName || ''
    } - Description: ${validatedInput.description || ''}]`
    const userData = {
      externalId: userExternalId,
    }
    const conversationData = {
      type: 'personal',
      displayName: validatedInput.displayName || undefined,
      description: validatedInput.description || undefined,
      iconUrl: validatedInput.iconUrl || undefined,
      participants: [
        {
          userExternalId,
        },
      ],
    }
    const messageData = {
      author: {
        type: 'user',
        userExternalId,
      },
      content: {
        type: 'text',
        text: validatedInput.agentContextInfo || defaultAgentContextInfo,
      },
      metadata: {
        userExternalId,
      },
    }
    let conversation
    try {
      await ZensunClient.getOrCreateUser(userData)
      conversation = await ZensunClient.getOrCreateConversation(
        conversationData
      )

      if (conversation.id) {
        await ZensunClient.postMessageSafe(conversation.id, messageData)
        logger
          .forBot()
          .info(`Successful - Create Conversation - ${conversation.id}`)
      }
    } catch (error) {
      logger
        .forBot()
        .debug(`'Create Conversation' exception ${JSON.stringify(error)}`)
    }

    return {
      id: conversation?.id || '',
    }
  }

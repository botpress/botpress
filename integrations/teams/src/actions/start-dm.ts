import { RuntimeError } from '@botpress/client'
import { ConversationParameters, ConversationReference } from 'botbuilder'
import { getAdapter } from '../utils'
import * as bp from '.botpress'

export const startDmConversation: bp.IntegrationProps['actions']['startDmConversation'] = async ({
  ctx,
  client,
  input,
}) => {
  const adapter = getAdapter(ctx.configuration)

  const conversationParameters = {
    isGroup: false,
    members: [
      {
        id: input.teamsUserId,
      },
    ],
  } as Partial<ConversationParameters>

  // We need an existing Botpress conversation on Teams because of the serviceUrl
  let state
  try {
    const stateRes = await client.getState({
      id: input.conversationId,
      name: 'conversation',
      type: 'conversation',
    })
    state = stateRes.state
  } catch (thrown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(
      `Failed to retrieve conversation state for the supplied Botpress conversation Id "${input.conversationId}", ` +
        `please make sure it's a valid Botpress conversation from channel "Teams" -> ${err.message}`
    )
  }

  const convRef = state.payload as ConversationReference

  let teamsConversationId
  try {
    await adapter.createConversation(convRef, conversationParameters, async (context) => {
      teamsConversationId = context.activity.conversation.id
    })
  } catch (thrown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(
      `Failed to create conversation on Teams for Teams user Id "${input.teamsUserId}", ` +
        `please make sure it's a valid Teams user Id and belongs to the bot tenant -> ${err.message}`
    )
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: teamsConversationId,
    },
    discriminateByTags: ['id'],
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: input.teamsUserId,
    },
  })

  return {
    conversationId: conversation.id,
    userId: user.id,
  }
}

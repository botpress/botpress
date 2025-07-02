import { RuntimeError } from '@botpress/client'
import { ConversationParameters, ConversationReference, TeamsInfo } from 'botbuilder'
import { getAdapter, getError } from '../utils'
import * as bp from '.botpress'

export const startDmConversation: bp.IntegrationProps['actions']['startDmConversation'] = async ({
  ctx,
  client,
  input,
}) => {
  const adapter = getAdapter(ctx.configuration)

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
    const err = getError(thrown)
    throw new RuntimeError(
      `Failed to retrieve conversation state for the supplied Botpress conversation Id "${input.conversationId}", ` +
        `please make sure it's a valid Botpress conversation from channel "Teams" -> ${err.message}`
    )
  }

  const convRef = state.payload as ConversationReference

  const { teamsUserEmail } = input
  let { teamsUserId } = input

  if(!teamsUserId?.length && !teamsUserEmail?.length) {
    throw new RuntimeError(
      `You must provide either a valid Teams user Id or email to start a DM conversation. ` +
      `Received: teamsUserId="${teamsUserId}", teamsUserEmail="${teamsUserEmail}"`
    )
  }

  // ── If we only have an email, call TeamsInfo.getMember to fetch the account ──
  if (!teamsUserId?.length && teamsUserEmail?.length) {
    try {
      await adapter.continueConversation(convRef, async (tc) => {
        const account = await TeamsInfo.getMember(tc, teamsUserEmail)
        teamsUserId = account.id
      })
    } catch (thrown) {
      const err = getError(thrown)
      throw new RuntimeError(
        `Could not look-up Teams user with email "${teamsUserEmail}" ` +
        `(bot must be installed where that user is reachable) → ${err.message}`
      )
    }
  }

  const conversationParameters = {
    isGroup: false,
    members: [
      {
        id: teamsUserId,
      },
    ],
  } as Partial<ConversationParameters>

  let teamsDMConversationId
  try {
    await adapter.createConversation(convRef, conversationParameters, async (context) => {
      teamsDMConversationId = context.activity.conversation.id
    })
  } catch (thrown) {
    const err = getError(thrown)
    throw new RuntimeError(
      `Failed to create conversation on Teams for Teams user Id "${input.teamsUserId}", ` +
        `please make sure it's a valid Teams user Id and belongs to the bot tenant -> ${err.message}`
    )
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: teamsDMConversationId,
    },
    discriminateByTags: ['id'],
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: teamsUserId,
    },
  })

  return {
    conversationId: conversation.id,
    userId: user.id,
  }
}

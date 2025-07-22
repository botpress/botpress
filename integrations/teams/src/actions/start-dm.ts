import { RuntimeError } from '@botpress/client'
import { ConversationParameters, ConversationReference, TeamsChannelAccount, TeamsInfo, TurnContext } from 'botbuilder'
import { getUserByEmail } from '../client'
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

  if (!teamsUserId?.length && !teamsUserEmail?.length) {
    throw new RuntimeError(
      'You must provide either a valid Teams user Id or email to start a DM conversation. ' +
        `Received: teamsUserId="${teamsUserId}", teamsUserEmail="${teamsUserEmail}"`
    )
  }

  // ── If we only have an email, call TeamsInfo.getMember to fetch the account ──
  if (!teamsUserId?.length && teamsUserEmail?.length) {
    try {
      const teamsUser = await getUserByEmail(ctx, teamsUserEmail)
      teamsUserId = teamsUser?.id
    } catch (thrown) {
      const err = getError(thrown)
      throw new RuntimeError(
        `Could not look-up Teams user with email "${teamsUserEmail}" ` +
          `(bot must be installed where that user is reachable and have "User.Read.All" API Permission at the Azure Portal) → ${err.message}`
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

  let newConvRef: Partial<ConversationReference> | undefined
  let newConvMember: TeamsChannelAccount | undefined
  try {
    await adapter.createConversation(convRef, conversationParameters, async (context) => {
      newConvRef = TurnContext.getConversationReference(context.activity)

      //If the user already spoke to the bot on DM, the Teams user will be available
      if (newConvRef.user?.id) {
        try {
          newConvMember = await TeamsInfo.getMember(context, newConvRef.user.id)
        } catch (err) {}
      }
    })
  } catch (thrown) {
    const err = getError(thrown)
    throw new RuntimeError(
      `Failed to create conversation on Teams for Teams user Id "${input.teamsUserId}", ` +
        `please make sure it's a valid Teams user Id and belongs to the bot tenant -> ${err.message}`
    )
  }

  if (!newConvRef?.conversation?.id) {
    throw new RuntimeError('Failed to get the reference for the new conversation')
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: newConvRef.conversation.id,
    },
    discriminateByTags: ['id'],
  })

  await client.setState({
    id: conversation.id,
    name: 'conversation',
    type: 'conversation',
    payload: newConvRef,
  })

  let userId
  if (newConvMember) {
    userId = (
      await client.getOrCreateUser({
        tags: {
          id: newConvMember.id,
          email: newConvMember.email,
        },
      })
    ).user.id

    await client.addParticipant({
      id: conversation.id,
      userId,
    })
  }

  return {
    userId,
    conversationId: conversation.id,
  }
}

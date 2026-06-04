import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import {
  searchContactByEmail,
  createContact,
  createConversation,
  resolveConversation,
  getPreviousAgentId,
  assignConversation,
  sendMessage,
  getActiveConversation,
  getApiAccessToken,
} from '../client'

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ ctx, client, input, logger }) => {
  const { email } = input

  if (!email) {
    throw new RuntimeError('Email is required for HITL')
  }

  try {
    const accountId = ctx.configuration.accountId

    const { user: botpressUser } = await client.getOrCreateUser({
      tags: { email },
    })

    let chatwootContactId: string
    const searchResult = await searchContactByEmail(getApiAccessToken(ctx), accountId, email)

    const existingContact = searchResult.payload?.[0]
    if (existingContact) {
      chatwootContactId = existingContact.id.toString()
      logger.forBot().info(`Found Chatwoot contact: ${chatwootContactId}`)
    } else {
      const newContact = await createContact(getApiAccessToken(ctx), accountId, email, ctx.configuration.inboxId)
      chatwootContactId = newContact.payload.contact.id.toString()
      logger.forBot().info(`Created Chatwoot contact: ${chatwootContactId}`)
    }

    await client.setState({
      id: botpressUser.id,
      type: 'user',
      name: 'userInfo',
      payload: { email, chatwootContactId },
    })

    return { userId: botpressUser.id }
  } catch (error) {
    logger.forBot().error(`createUser failed: ${error}`)
    throw new RuntimeError(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, input, logger }) => {
  const { userId, title, description = 'HITL started' } = input

  try {
    const apiAccessToken = getApiAccessToken(ctx)

    const userState = await client.getState({ id: userId, name: 'userInfo', type: 'user' })

    if (!userState?.state?.payload?.chatwootContactId) {
      throw new RuntimeError('Call createUser first')
    }

    const { chatwootContactId } = userState.state.payload
    const accountId = ctx.configuration.accountId

    const activeConversation = await getActiveConversation(apiAccessToken, accountId, chatwootContactId)

    let chatwootConvId: string

    if (activeConversation) {
      chatwootConvId = activeConversation.id.toString()
      logger.forBot().info(`Reusing existing conversation: ${chatwootConvId}`)
    } else {
      const chatwootConv = await createConversation(
        apiAccessToken,
        accountId,
        chatwootContactId,
        ctx.configuration.inboxId
      )
      chatwootConvId = chatwootConv.id.toString()
      logger.forBot().info(`Created new conversation: ${chatwootConvId}`)
    }

    await sendMessage(apiAccessToken, accountId, chatwootConvId, description, 'incoming')

    try {
      const previousAgentId = await getPreviousAgentId(apiAccessToken, accountId, chatwootContactId)
      if (previousAgentId) {
        await assignConversation(apiAccessToken, accountId, chatwootConvId, previousAgentId.toString())
        logger.forBot().info(`Assigned to previous agent: ${previousAgentId}`)
      }
    } catch (error) {
      logger.forBot().warn(`Failed to assign to previous agent: ${error}`)
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: { id: chatwootConvId, bpUserId: userId },
    })

    await client.createEvent({
      type: 'hitlStarted',
      conversationId: conversation.id,
      payload: { conversationId: conversation.id, userId, title: title ?? 'HITL', description },
    })

    logger.forBot().info(`HITL started: ${conversation.id} → Chatwoot ${chatwootConvId}`)
    return { conversationId: conversation.id }
  } catch (error) {
    throw new RuntimeError(`Failed to start HITL: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, client, input }) => {
  const { conversationId } = input

  try {
    const { conversation } = await client.getConversation({ id: conversationId })
    const chatwootConvId = conversation.tags.id

    if (!chatwootConvId) {
      return { success: false, message: 'No Chatwoot conversation ID' }
    }

    const accountId = ctx.configuration.accountId
    await resolveConversation(getApiAccessToken(ctx), accountId, chatwootConvId)

    await client.createEvent({
      type: 'hitlStopped',
      payload: { conversationId },
    })

    return { success: true, message: 'HITL stopped' }
  } catch (error) {
    return { success: false, message: String(error) }
  }
}

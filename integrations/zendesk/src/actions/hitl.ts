import { buildConversationTranscript } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { getZendeskClient, type ZendeskClient } from '../client'
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async (props) => {
  const { ctx, input, client } = props

  const { viaChannel, priority } = input.hitlSession || {}

  const downstreamBotpressUser = await client.getUser({ id: ctx.botUserId })
  const chatbotName = input.hitlSession?.chatbotName ?? downstreamBotpressUser.user.name ?? 'Botpress'
  const chatbotPhotoUrl =
    input.hitlSession?.chatbotPhotoUrl ??
    downstreamBotpressUser.user.pictureUrl ??
    'https://app.botpress.dev/favicon/bp.svg'

  const zendeskClient = getZendeskClient(ctx.configuration)
  const zendeskBotpressUser = await _retrieveAndUpdateZendeskBotpressUser(props, {
    zendeskClient,
    chatbotName,
    chatbotPhotoUrl,
  })

  const ticket = await zendeskClient.createTicket(
    input.title ?? 'Untitled Ticket',
    await _buildTicketBody(props, { chatbotName }),
    {
      id: zendeskBotpressUser,
    },
    {
      priority,
      via: {
        channel: viaChannel,
      },
    }
  )

  const zendeskTicketId = `${ticket.id}`
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: zendeskTicketId,
    },
  })

  await zendeskClient.updateTicket(zendeskTicketId, {
    external_id: conversation.id,
  })

  return {
    conversationId: conversation.id,
  }
}

const _retrieveAndUpdateZendeskBotpressUser = async (
  { client, ctx }: bp.ActionProps['startHitl'],
  {
    zendeskClient,
    chatbotName,
    chatbotPhotoUrl,
  }: { zendeskClient: ZendeskClient; chatbotName: string; chatbotPhotoUrl: string }
) => {
  await client.updateUser({
    id: ctx.botUserId,
    pictureUrl: chatbotPhotoUrl,
    name: chatbotName,
  })

  const zendeskUser = await zendeskClient.createOrUpdateUser({
    external_id: ctx.botUserId,
    name: chatbotName,
    remote_photo_url: chatbotPhotoUrl,
  })

  return String(zendeskUser.id)
}

const _buildTicketBody = async (
  { input, client, ctx }: bp.ActionProps['startHitl'],
  { chatbotName }: { chatbotName: string }
) => {
  const description = input.description?.trim() || `Someone opened a ticket using your ${chatbotName} chatbot.`
  const messageHistory = await buildConversationTranscript({ client, ctx, messages: input.messageHistory })

  return description + (messageHistory.length ? `\n\n---\n\n${messageHistory}` : '')
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, input, client }) => {
  const { conversation } = await client.getConversation({
    id: input.conversationId,
  })

  const ticketId: string | undefined = conversation.tags.id
  if (!ticketId) {
    return {}
  }

  const zendeskClient = getZendeskClient(ctx.configuration)

  try {
    await zendeskClient.updateTicket(ticketId, {
      status: 'closed',
    })
    return {}
  } catch (err) {
    console.error('Could not close ticket', err)
    throw new sdk.RuntimeError(`Failed to close ticket: ${err}`)
  }
}

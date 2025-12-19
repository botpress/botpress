import { buildConversationTranscript } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { getZendeskClient, type ZendeskClient } from '../client'
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async (props) => {
  const { ctx, input, client: bpClient } = props

  const downstreamBotpressUser = await bpClient.getUser({ id: ctx.botUserId })
  const chatbotName = input.hitlSession?.chatbotName ?? downstreamBotpressUser.user.name ?? 'Botpress'
  const chatbotPhotoUrl =
    input.hitlSession?.chatbotPhotoUrl ??
    downstreamBotpressUser.user.pictureUrl ??
    'https://app.botpress.dev/favicon/bp.svg'

  const { user } = await bpClient.getUser({
    id: input.userId,
  })

  const zendeskAuthorId = user.tags.id

  if (!zendeskAuthorId) {
    throw new sdk.RuntimeError(`User ${user.id} not linked in Zendesk`)
  }

  const zendeskClient = await getZendeskClient(bpClient, ctx)
  await _updateZendeskBotpressUser(props, {
    zendeskClient,
    chatbotName,
    chatbotPhotoUrl,
  })

  const requester = input.hitlSession?.requesterName
    ? {
        name: input.hitlSession?.requesterName,
        ...(input.hitlSession?.requesterEmail ? { email: input.hitlSession?.requesterEmail } : {}),
      }
    : { id: zendeskAuthorId }

  const ticket = await zendeskClient.createTicket(
    input.title ?? 'Untitled Ticket',
    await _buildTicketBody(props, { chatbotName }),
    requester,
    {
      priority: input.hitlSession?.priority,
    }
  )

  const zendeskTicketId = `${ticket.id}`
  const { conversation } = await bpClient.getOrCreateConversation({
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

const _updateZendeskBotpressUser = async (
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

  await zendeskClient.createOrUpdateUser({
    external_id: ctx.botUserId,
    name: chatbotName,
    remote_photo_url: chatbotPhotoUrl,
  })
}

const _buildTicketBody = async (
  { input, client, ctx }: bp.ActionProps['startHitl'],
  { chatbotName }: { chatbotName: string }
) => {
  const description = input.description?.trim() || `Someone opened a ticket using your ${chatbotName} chatbot.`
  const messageHistory = await buildConversationTranscript({ client, ctx, messages: input.messageHistory })

  return description + (messageHistory.length ? `\n\n---\n\n${messageHistory}` : '')
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, input, client: bpClient }) => {
  const { conversation } = await bpClient.getConversation({
    id: input.conversationId,
  })

  const ticketId: string | undefined = conversation.tags.id
  if (!ticketId) {
    return {}
  }

  const zendeskClient = await getZendeskClient(bpClient, ctx)

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

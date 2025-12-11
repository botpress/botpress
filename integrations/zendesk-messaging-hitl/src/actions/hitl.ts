import { RuntimeError } from '@botpress/client'
import { buildConversationTranscript } from '@botpress/common'
import { getSuncoClient } from 'src/client'
import { getSwitchboardIntegrationId, getAgentWorkspaceSwitchboardIntegrationId } from 'src/setup/util'
import { Client, IntegrationCtx, User, HitlSession, MessageHistory } from 'src/types'
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, input, logger }) => {
  try {
    const suncoClient = getSuncoClient(ctx.configuration)

    const { user } = await client.getUser({
      id: input.userId,
    })

    const suncoUserId = user.tags.id
    if (!suncoUserId?.length) {
      throw new RuntimeError("Input user doesn't have a Sunco User Id")
    }

    const { title, description, messageHistory } = input

    const suncoConversation = await suncoClient.createConversation({
      userId: suncoUserId,
    })

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: suncoConversation.id,
      },
    })

    // Get switchboard integration IDs (from cache or fetch at runtime)
    const switchboardIntegrationId = await getSwitchboardIntegrationId(ctx, client, logger)
    const agentWorkspaceSwitchboardIntegrationId = await getAgentWorkspaceSwitchboardIntegrationId(ctx, client, logger)

    // Pass control from conversation to our Integration in the switchboard, necessary so the initial message can be sent without creating the ticket yet
    // Reason: If the ticket is created because of the initial message, we can't specify ticket metadata anymore (ticket fields, priority, etc.)
    await suncoClient.switchboardActionsPassControl(suncoConversation.id, switchboardIntegrationId)

    // Send a initial message with the conversation title, description and transcript
    // Having a message will allow us to pass control to the agent workspace without requiring a 'reason'
    await suncoClient.sendMessages(
      suncoConversation.id,
      { displayName: 'HITL Session' },
      await _buildInitialMessages({
        ctx,
        client,
        user,
        title,
        description,
        messageHistory,
      })
    )

    const metadata = _buildMetadata(input.hitlSession, user)

    logger
      .forBot()
      .info('Passing control to the agent workspace with the following metadata: ' + JSON.stringify({ metadata }))

    // Pass control to the agent workspace with the metadata to correctly create fields
    await suncoClient.switchboardActionsPassControl(
      suncoConversation.id,
      agentWorkspaceSwitchboardIntegrationId,
      metadata
    )

    // Offer control to our integration so our webhook can receive messages from the agent workspace, even if we don't control it
    // In theory we could skip this if deliverStandbyEvents was enabled on our Switchboard Integration record but this way we prevent
    // all bots that use this HITL integration from receiving webhook events from all conversations
    await suncoClient.switchboardActionsOfferControl(suncoConversation.id, switchboardIntegrationId)

    return {
      conversationId: conversation.id,
    }
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    throw new RuntimeError(errMsg)
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ input, client, ctx, logger }) => {
  const { conversation } = await client.getConversation({
    id: input.conversationId,
  })

  const suncoConversationId: string | undefined = conversation.tags.id

  if (!suncoConversationId) {
    logger.forBot().warn('No Sunco conversation ID found, cannot release control')
    return {}
  }

  try {
    const suncoClient = getSuncoClient(ctx.configuration)

    logger.forBot().info(`Releasing control from switchboard for conversation ${suncoConversationId}`)
    await suncoClient.switchboardActionsReleaseControl(suncoConversationId)
    logger.forBot().info(`HITL conversation ${suncoConversationId} stopped and control released`)
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().error(`Failed to release control for conversation ${suncoConversationId}: ${errMsg}`)
  }

  return {}
}

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, input, ctx, logger }) => {
  logger.forBot().info('createUser called', { input })

  try {
    const suncoClient = getSuncoClient(ctx.configuration)

    const { user: botpressUser } = await client.getOrCreateUser({
      ...input,
      tags: {
        email: input.email,
      },
    })

    const suncoUser = await suncoClient.getOrCreateUser({
      ...input,
      externalId: botpressUser.id,
    })

    if (!suncoUser.id) {
      throw new RuntimeError('Failed to create Sunco User')
    }

    await client.updateUser({
      ...input,
      id: botpressUser.id,
      tags: {
        id: suncoUser.id,
      },
    })

    return {
      userId: botpressUser.id,
    }
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    throw new RuntimeError(errMsg)
  }
}

function _buildMetadata(hitlSession?: HitlSession, user?: User): Record<string, string> {
  const metadata: Record<string, string> = {}

  if (user?.name?.length) {
    metadata['dataCapture.systemField.requester.name'] = user.name
  }

  if (user?.tags?.email?.length) {
    metadata['dataCapture.systemField.requester.email'] = user.tags.email
  }

  if (hitlSession?.priority?.length) {
    metadata['dataCapture.systemField.priority'] = hitlSession.priority
  }

  if (hitlSession?.originSourceType?.length) {
    metadata.origin_source_type = hitlSession.originSourceType
  }

  if (hitlSession?.organizationId?.length) {
    metadata['dataCapture.systemField.organization_id'] = hitlSession.organizationId
  }

  if (hitlSession?.brandId?.length) {
    metadata['dataCapture.systemField.brand_id'] = hitlSession.brandId
  }

  if (hitlSession?.groupId?.length) {
    metadata['dataCapture.systemField.group_id'] = hitlSession.groupId
  }

  if (hitlSession?.assigneeId?.length) {
    metadata['dataCapture.systemField.assignee_id'] = hitlSession.assigneeId
  }

  if (hitlSession?.tags && hitlSession.tags.length > 0) {
    metadata['dataCapture.systemField.tags'] = hitlSession.tags.join(',')
  }

  if (hitlSession?.customTicketFields?.length) {
    for (const field of hitlSession.customTicketFields) {
      if (field.id?.length && field.value?.length) {
        metadata[`dataCapture.ticketField.${field.id}`] = field.value
      }
    }
  }

  if (hitlSession?.additionalMetadata?.length) {
    for (const field of hitlSession.additionalMetadata) {
      if (field.key?.length && field.value?.length) {
        metadata[field.key] = field.value
      }
    }
  }

  return metadata
}

async function _buildInitialMessages(args: {
  ctx: IntegrationCtx
  client: Client
  user?: User
  title?: string
  description?: string
  messageHistory: MessageHistory
}): Promise<Array<{ type: 'text'; text: string }>> {
  const { ctx, client, user, title, description, messageHistory } = args

  const transcript = await buildConversationTranscript({
    ctx,
    client,
    messages: messageHistory,
    customTranscriptFormatter: (msgs) =>
      msgs.map((msg) => (msg.isBot ? 'Bot: ' : 'User: ') + msg.text.join('\n')).join('\n\n'),
  })

  return [
    {
      type: 'text' as const,
      text: `New Conversation Started

Email: ${user?.tags?.email || 'No email provided'}
Title: ${title || 'Untitled'}
Description: ${description || 'No description provided'}
        `,
    },
    {
      type: 'text' as const,
      text: 'Transcript:\n\n' + transcript,
    },
  ]
}

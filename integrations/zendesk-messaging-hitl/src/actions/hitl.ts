import { RuntimeError } from '@botpress/client'
import { buildConversationTranscript } from '@botpress/common'
import { getSuncoClient } from '../client'
import * as bp from '.botpress'

const HARDCODED_INTEGRATION_ID = '692858db3a53da56d1f3ea8e'
const HARDCODED_AGENTWORKSPACE_INTEGRATION_ID = '691f299f55f344bf8e933060'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, input, logger }) => {
  try {
    const suncoClient = getSuncoClient(
      {
        appId: ctx.configuration.appId,
        keyId: ctx.configuration.keyId,
        keySecret: ctx.configuration.keySecret,
      },
      logger
    )

    const { user } = await client.getUser({
      id: input.userId,
    })

    if (!user.tags.id?.length) {
      throw new RuntimeError("Input user doesn't have a Sunco User Id")
    }

    const { title, description, messageHistory } = input

    const messages = [
      {
        role: 'appMaker' as const,
        type: 'text',
        text: `New Conversation Started

Title: ${title || 'Untitled'}
Description: ${description || 'No description provided'}
        `,
      },
    ]

    // Add conversation transcript
    const transcript = await buildConversationTranscript({
      ctx,
      client,
      messages: messageHistory,
      customTranscriptFormatter: (msgs) =>
        msgs.map((msg) => (msg.isBot ? 'Bot: ' : 'User: ') + msg.text.join('\n')).join('\n\n'),
    })

    if (transcript.length > 0) {
      messages.push({
        role: 'appMaker' as const,
        type: 'text',
        text: 'Transcript:\n\n' + transcript,
      })
    }

    const suncoConversation = await suncoClient.createConversation({
      userId: user.tags.id as string,
      messages,
    })

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: suncoConversation.id,
      },
    })

    // Pass control from conversation to our Integration in the switchboard, necessary so the initial message can be sent without creating the ticket yet
    // Reason: If the ticket is created because of the initial message, we can't specify ticket metadata anymore (ticket fields, priority, etc.)
    await suncoClient.switchboardActionsPassControl(suncoConversation.id, HARDCODED_INTEGRATION_ID)

    // Send a initial message
    // Having a message will allow us to pass control to the agent workspace without requiring a 'reason'
    await suncoClient.sendMessage(suncoConversation.id, { displayName: 'HITL Session' }, [
      { type: 'text', text: 'HITL Conversation Initiated' },
    ])

    // Pass control to the agent workspace with the metadata to correctly create fields
    await suncoClient.switchboardActionsPassControl(suncoConversation.id, HARDCODED_AGENTWORKSPACE_INTEGRATION_ID, {
      'dataCapture.ticketField.40033266756891': 'LLLLLLL',
      origin_source_type: 'whatsapp',
    })

    return {
      conversationId: conversation.id,
    }
  } catch (error: any) {
    logger.forBot().error('Error Starting Sunco Hitl: ' + error.message, error?.response?.data)
    throw new RuntimeError(error.message)
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
    const suncoClient = getSuncoClient(
      {
        appId: ctx.configuration.appId,
        keyId: ctx.configuration.keyId,
        keySecret: ctx.configuration.keySecret,
      },
      logger
    )

    logger.forBot().info(`Releasing control from switchboard for conversation ${suncoConversationId}`)
    await suncoClient.sendMessage(suncoConversationId, { displayName: 'HITL Session' }, [
      { type: 'text', text: 'HITL Session Closed' },
      { type: 'text', text: JSON.stringify({ input }) },
    ])
    await suncoClient.switchboardActionsReleaseControl(suncoConversationId, 'ticketClosed')
    logger.forBot().info(`HITL conversation ${suncoConversationId} stopped and control released`)
  } catch (error: any) {
    logger.forBot().error(`Failed to release control for conversation ${suncoConversationId}: ${error.message}`, error)
    // Don't throw - we still want to return success even if releaseControl fails
  }

  return {}
}

// create a user in both platforms
export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, input, ctx, logger }) => {
  logger.forBot().info('createUser called', { input })

  try {
    const suncoClient = getSuncoClient(
      {
        appId: ctx.configuration.appId,
        keyId: ctx.configuration.keyId,
        keySecret: ctx.configuration.keySecret,
      },
      logger
    )

    const { user: botpressUser } = await client.getOrCreateUser({
      ...input,
      tags: {
        email: input.email,
      },
    })

    const suncoUser = await suncoClient.getOrCreateUser({
      ...input,
      botpressUserId: botpressUser.id,
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
  } catch (error: any) {
    throw new RuntimeError(error.message)
  }
}

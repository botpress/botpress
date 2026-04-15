import { RuntimeError } from '@botpress/sdk'
import { getConversationByExternalIdOrThrow } from '../utils/conversation'
import * as bp from '.botpress'

type HubSpotAttachment = {
  fileId?: string
  url?: string
  name?: string
  type?: string // always 'FILE'
  fileUsageType?: 'IMAGE' | 'AUDIO' | 'VOICE_RECORDING' | 'STICKER' | 'OTHER'
}

type HubSpotMessage = {
  conversationsThreadId: string
  text?: string
  senders?: Array<{ actorId: string }>
  attachments?: HubSpotAttachment[]
}

type HubSpotEvent = {
  type: string
  message?: HubSpotMessage
}

type OperatorRepliedParams = {
  hubspotEvent: HubSpotEvent
  client: bp.Client
  logger: bp.Logger
}

export const handleOperatorReplied = async ({ hubspotEvent, client, logger }: OperatorRepliedParams) => {
  try {
    if (!hubspotEvent.message?.conversationsThreadId) {
      throw new RuntimeError('Missing conversation thread ID in operator message')
    }

    const conversation = await getConversationByExternalIdOrThrow(client, hubspotEvent.message.conversationsThreadId)

    const actorId = hubspotEvent.message?.senders?.[0]?.actorId

    if (!actorId) {
      throw new RuntimeError('Missing actorId in operator message senders')
    }

    const { user } = await client.getOrCreateUser({
      tags: { actorId },
      discriminateByTags: ['actorId'],
    })

    if (!user?.id) {
      throw new RuntimeError('Failed to get or create agent user')
    }

    if (hubspotEvent.message.text) {
      await client.createMessage({
        tags: {},
        type: 'text',
        userId: user.id,
        conversationId: conversation.id,
        payload: { text: hubspotEvent.message.text },
      })
    }

    for (const attachment of hubspotEvent.message.attachments ?? []) {
      if (!attachment.url) {
        logger.forBot().warn('Skipping attachment with no URL')
        continue
      }

      const usageType = attachment.fileUsageType
      if (usageType === 'IMAGE') {
        await client.createMessage({
          tags: {},
          type: 'image',
          userId: user.id,
          conversationId: conversation.id,
          payload: { imageUrl: attachment.url, title: attachment.name },
        })
      } else if (usageType === 'AUDIO' || usageType === 'VOICE_RECORDING') {
        await client.createMessage({
          tags: {},
          type: 'audio',
          userId: user.id,
          conversationId: conversation.id,
          payload: { audioUrl: attachment.url, title: attachment.name },
        })
      } else {
        await client.createMessage({
          tags: {},
          type: 'file',
          userId: user.id,
          conversationId: conversation.id,
          payload: { fileUrl: attachment.url, title: attachment.name },
        })
      }
    }
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().error(`Failed to handle "operator replied" event: ${error.message}`)
  }
}

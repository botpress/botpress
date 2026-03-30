import { Conversation } from '@botpress/client'
import { AnyIncomingMessage } from '@botpress/sdk/dist/bot'
import * as genenv from '../.genenv'
import * as bp from '.botpress'

const DEFAULT_SLACK_CHANNEL = genenv.SLACKBOX_SLACK_CHANNEL
const FALLBACK_SLACK_CHANNEL = genenv.SLACKBOX_FALLBACK_SLACK_CHANNEL || DEFAULT_SLACK_CHANNEL

const cachedSlackConversationIds: Record<string, string> = {}

const bot = new bp.Bot({
  actions: {},
})

bot.on.message('*', async (props) => {
  const { conversation, message, client, ctx, logger } = props

  if (!conversation.integration.includes('gmail')) {
    logger.info('[Slackbox] Not a Gmail message, skipping')
    return
  }

  try {
    const shouldForward = await _shouldForwardEmail(client, conversation, logger)
    if (!shouldForward) {
      logger.info('Email filtered out - no matching Integrations label')
      return
    }

    const subject = (conversation.tags['gmail:subject'] || conversation.tags.subject) as string | undefined
    const targetChannel = _getTargetChannel(subject)
    const slackConversationId = await _getSlackConversationId(client, logger, targetChannel)

    const notificationMessage = _mapGmailToSlack(conversation, message)

    await client.createMessage({
      type: 'text',
      conversationId: slackConversationId,
      tags: {},
      userId: ctx.botId,
      payload: {
        text: notificationMessage,
      },
    })
  } catch (error) {
    logger.error(`Failed to send email notification: ${error}`)
  }
})

const _shouldForwardEmail = async (
  client: bp.Client,
  conversation: Conversation,
  logger: bp.MessageHandlerProps['logger']
): Promise<boolean> => {
  const threadId = conversation.tags['gmail:id']

  if (!threadId) {
    logger.info('[LabelCheck] No threadId, forwarding email')
    return true
  }

  try {
    const labelsResponse = await client.callAction({
      type: 'gmail:listLabels',
      input: {},
    })
    const labels = labelsResponse.output.labels || []

    const threadResponse = await client.callAction({
      type: 'gmail:getThread',
      input: { id: threadId },
    })
    const messages = threadResponse.output.messages || []

    const allLabelIds = new Set<string>()
    messages.forEach((msg) => {
      msg.labelIds?.forEach((labelId) => allLabelIds.add(labelId))
    })

    if (allLabelIds.size === 0) {
      logger.info('[LabelCheck] No labels on thread, forwarding email')
      return true
    }

    const labelsById = new Map<string, { type?: string; name?: string }>()
    labels.forEach((label) => {
      if (label.id) {
        labelsById.set(label.id, { type: label.type || undefined, name: label.name || undefined })
      }
    })

    const userLabels = [...allLabelIds].filter((labelId) => {
      const label = labelsById.get(labelId)
      return label?.type === 'user'
    })

    if (userLabels.length === 0) {
      logger.info('[LabelCheck] No user labels, forwarding email')
      return true
    }

    const hasIntegrationLabel = userLabels.some((labelId) => {
      const label = labelsById.get(labelId)
      return label?.name === 'Integrations' || label?.name?.startsWith('Integrations/')
    })

    return hasIntegrationLabel
  } catch (error) {
    logger.error(`[LabelCheck] Error checking email labels: ${error}`)
    return true
  }
}

const _getSlackConversationId = async (
  client: bp.Client,
  logger: bp.MessageHandlerProps['logger'],
  channelName: string
): Promise<string> => {
  if (cachedSlackConversationIds[channelName]) {
    return cachedSlackConversationIds[channelName]
  }

  logger.info(`Fetching Slack conversation ID for channel: ${channelName}`)
  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.callAction({
        type: 'slack:startChannelConversation',
        input: {
          channelName,
        },
      })
      cachedSlackConversationIds[channelName] = response.output.conversationId
      return cachedSlackConversationIds[channelName]
    } catch (err) {
      logger.warn(`Attempt ${attempt}/${maxRetries} failed: ${err}`)
      if (attempt === maxRetries) {
        throw err
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  throw new Error('Failed to get Slack conversation ID after retries')
}

const _getTargetChannel = (subject: string | undefined): string => {
  if (subject?.toLowerCase().includes('test')) {
    return FALLBACK_SLACK_CHANNEL
  }
  return DEFAULT_SLACK_CHANNEL
}

const _mapGmailToSlack = (conversation: Conversation, message: AnyIncomingMessage<bp.TBot>) => {
  const subject = (conversation.tags['gmail:subject'] || conversation.tags.subject) as string | undefined
  const fromEmail = (conversation.tags['gmail:email'] || conversation.tags.email) as string | undefined
  const messageText =
    message.type === 'text' ? (message.payload as { text?: string }).text || 'No content' : 'New email received'

  const preview = messageText.length > 200 ? messageText.substring(0, 200) + '...' : messageText
  const notificationMessage =
    '📦 *New email received!*\n\n' +
    `*Subject:* ${subject || '(No subject)'}\n` +
    `*From:* ${fromEmail || 'Unknown'}\n` +
    `*Body:*\n${preview || 'Preview unavailable'}`

  return notificationMessage
}
export default bot

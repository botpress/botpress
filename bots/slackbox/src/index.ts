import { Conversation } from '@botpress/client'
import { AnyIncomingMessage } from '@botpress/sdk/dist/bot'
import * as genenv from '../.genenv'
import * as bp from '.botpress'

const DEFAULT_SLACK_CHANNEL = genenv.SLACKBOX_SLACK_CHANNEL

let cachedSlackConversationId: string | undefined

const getSlackConversationId = async (client: bp.Client, logger: bp.MessageHandlerProps['logger']): Promise<string> => {
  if (cachedSlackConversationId) {
    return cachedSlackConversationId
  }

  logger.info('Fetching Slack conversation ID (first time)')
  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.callAction({
        type: 'slack:startChannelConversation',
        input: {
          channelName: DEFAULT_SLACK_CHANNEL,
        },
      })
      cachedSlackConversationId = response.output.conversationId
      return cachedSlackConversationId
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

const bot = new bp.Bot({
  actions: {},
})

bot.on.message('*', async (props) => {
  const { conversation, message, client, ctx, logger } = props

  if (!conversation.integration.includes('gmail')) {
    return
  }

  try {
    const slackConversationId = await getSlackConversationId(client, logger)
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

    logger.info('Email notification sent to Slack')
  } catch (error) {
    logger.error(`Failed to send email notification: ${error}`)
  }
})

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

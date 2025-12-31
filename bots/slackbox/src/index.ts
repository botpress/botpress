import { Conversation } from '@botpress/client'
import { AnyIncomingMessage } from '@botpress/sdk/dist/bot'
import * as genenv from '../.genenv'
import * as bp from '.botpress'

const DEFAULT_SLACK_CHANNEL = genenv.SLACKBOX_SLACK_CHANNEL

const bot = new bp.Bot({
  actions: {},
})

bot.on.message('*', async (props) => {
  const { conversation, message, client, ctx, logger } = props

  if (!conversation.integration.includes('gmail')) {
    return
  }

  try {
    const { state: slackState } = await client.getOrSetState({
      name: 'slackConversationId',
      type: 'bot',
      id: ctx.botId,
      payload: {
        conversationId: undefined as string | undefined,
      },
    })

    let slackConversationId = slackState.payload.conversationId

    if (!slackConversationId) {
      const response = await client.callAction({
        type: 'slack:startChannelConversation',
        input: {
          channelName: DEFAULT_SLACK_CHANNEL,
        },
      })

      slackConversationId = response.output.conversationId

      await client.setState({
        id: ctx.botId,
        name: 'slackConversationId',
        type: 'bot',
        payload: {
          conversationId: slackConversationId,
        },
      })
    }

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

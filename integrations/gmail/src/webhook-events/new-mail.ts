// @ts-ignore
import parseMessage from 'gmail-api-parse-message'
import { parse as parseHtml } from 'node-html-parser'
import { GoogleClient } from '../google-api'
import { decodeBase64URL } from '../utils/string-utils'
import * as bp from '.botpress'

export const handleIncomingEmail = async (props: bp.HandlerProps) => {
  const { req, client, ctx } = props
  const bodyContent = JSON.parse(req.body || '{}')

  const data = bodyContent.message?.data
  console.info('data', data)

  if (!data) {
    console.warn('Handler received an invalid body (no data)')
    return
  }

  const messageData = JSON.parse(decodeBase64URL(data))
  console.info('messageData', messageData)

  const { historyId: historyIdNumber, emailAddress } = messageData
  const historyId = `${historyIdNumber}`
  console.info('historyId', historyId)

  if (!historyId) {
    console.warn('Handler received an invalid body (no historyId)')
    return
  }

  // Only proceed if the incoming historyId is greater that the latest processed historyId
  console.info('creating gmail client')
  const googleClient = await GoogleClient.create({ client, ctx })

  const {
    state: { payload },
  } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const lastHistoryId = payload.lastHistoryId ?? _fakeHistoryId(historyId)

  if (!payload.lastHistoryId) {
    await client.setState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: {
        ...payload,
        lastHistoryId,
      },
    })
  }

  const history = await googleClient.getMyHistory(lastHistoryId)

  console.info(JSON.stringify(history, null, 2))

  const messageIds = history.history?.reduce((acc, h) => {
    h.messagesAdded?.forEach((m) => {
      if (m.message?.id) {
        acc.push(m.message?.id)
      }
    })

    return acc
  }, [] as string[])

  if (!messageIds?.length) {
    console.info('Handler received an empty message id')
    return
  }

  await Promise.all(messageIds.map((id) => _processMessage(props, id, googleClient, emailAddress)))

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      ...payload,
      lastHistoryId: historyId,
    },
  })
}

const _processMessage = async (
  { client }: bp.HandlerProps,
  messageId: string,
  googleClient: GoogleClient,
  emailAddress: string
) => {
  console.info('getting history')
  const gmailMessage = await googleClient.getMessageById(messageId)

  const message = parseMessage(gmailMessage)
  console.info('message', message)

  const threadId = message.threadId

  if (!threadId) {
    console.info('Handler received an empty chat id')
    throw new Error('Handler received an empty chat id')
  }

  const replyTo = message.headers['reply-to']
  const inReplyTo = message.headers['message-id']
  const from = message.headers['from']
  const { name: senderName, email: userEmail } = _extractNameAndEmailFromSender(replyTo ?? from)
  console.info('userEmail', userEmail)

  if (userEmail === emailAddress) {
    return
  }

  console.info('threadId', threadId)
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: `${threadId}`,
    },
  })

  console.info('conversation', conversation)

  const { conversation: updatedConversation } = await client.updateConversation({
    id: conversation.id,
    tags: {
      subject: message.headers['subject'],
      email: userEmail,
      references: message.headers['references'],
      cc: message.headers['cc'],
    },
  })

  console.info('updatedConversation', updatedConversation)

  if (!userEmail) {
    throw new Error('Handler received an empty from id')
  }

  console.info('userEmail', userEmail)
  const { user } = await client.getOrCreateUser({
    tags: {
      id: `${userEmail}`,
    },
    name: senderName,
  })

  let content = message.textPlain ?? message.snippet

  if (message.textHtml) {
    try {
      // Extract the body from the message:
      const rootNode = parseHtml(message.textHtml)
      const bodyNode = rootNode.querySelector('body')
      const messageRoot = bodyNode ?? rootNode

      // Remove previous quoted messages in the thread:
      messageRoot.querySelectorAll('.gmail_quote')?.forEach((m) => m.remove())

      // Extract the text content:
      content = messageRoot.structuredText
    } catch (thrown) {
      console.error('Error while parsing html content', thrown)
    }
  }

  console.info('getOrCreateMessage', { threadId, userEmail, content, inReplyTo })
  await client.getOrCreateMessage({
    tags: { id: messageId },
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text: content },
  })

  await client.setState({
    type: 'conversation',
    name: 'thread',
    id: conversation.id,
    payload: {
      inReplyTo,
    },
  })
}

const _fakeHistoryId = (historyId: string) => `${+historyId - 100}`

const _extractNameAndEmailFromSender = (sender: string) => {
  const [nameAndWhitespaces, potentialEmail] = sender.trim().split('<')
  const name = nameAndWhitespaces?.trimEnd() ?? ''
  const email = potentialEmail ? (potentialEmail.split('>')[0] ?? '') : name

  return { name: name || email, email }
}

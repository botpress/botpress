import type { Conversation } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import cheerio from 'cheerio'
// @ts-ignore
import parseMessage from 'gmail-api-parse-message'
import { gmail_v1, google } from 'googleapis'
import { decode } from 'js-base64'
import MailComposer from 'nodemailer/lib/mail-composer'
import type Mail from 'nodemailer/lib/mailer'
import queryString from 'query-string'
import { ccTag, emailTag, idTag, referencesTag, subjectTag } from './const'
import * as bp from '.botpress'

const clientId = bp.secrets.CLIENT_ID
const clientSecret = bp.secrets.CLIENT_SECRET
const topicName = bp.secrets.TOPIC_NAME

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async ({ ctx, client, conversation, ack, payload }) => {
          console.info('sending email')

          const { state } = await client.getState({
            type: 'conversation',
            name: 'thread',
            id: conversation.id,
          })

          if (!state.payload.inReplyTo) {
            console.info('No inReplyTo tag found')
            return
          }

          await sendEmail({
            ctx,
            content: payload.text,
            conversation,
            client,
            ack,
            inReplyTo: state.payload.inReplyTo,
          })
        },
        image: async (props) => {
          console.info('conversation', props.conversation)
          console.info('message', props.message)
          console.info('user', props.user)
        },
        markdown: async (props) => {
          console.info('conversation', props.conversation)
          console.info('message', props.message)
          console.info('user', props.user)
        },
        audio: async (props) => {
          console.info('conversation', props.conversation)
          console.info('message', props.message)
          console.info('user', props.user)
        },
        video: async (props) => {
          console.info('conversation', props.conversation)
          console.info('message', props.message)
          console.info('user', props.user)
        },
        file: async (props) => {
          console.info('conversation', props.conversation)
          console.info('message', props.message)
          console.info('user', props.user)
        },
        location: async (props) => {
          console.info('conversation', props.conversation)
          console.info('message', props.message)
          console.info('user', props.user)
        },
        card: async (props) => {
          console.info('conversation', props.conversation)
          console.info('message', props.message)
          console.info('user', props.user)
        },
        carousel: async (props) => {
          console.info('conversation', props.conversation)
          console.info('message', props.message)
          console.info('user', props.user)
        },
        dropdown: async (props) => {
          console.info('conversation', props.conversation)
          console.info('message', props.message)
          console.info('user', props.user)
        },
        choice: async ({ client, conversation, ctx, payload, ack }) => {
          console.info('sending email')

          const { state } = await client.getState({
            type: 'conversation',
            name: 'thread',
            id: conversation.id,
          })

          if (!state.payload.inReplyTo) {
            console.info('No inReplyTo tag found')
            return
          }

          let content = `${payload.text}\n`

          for (const option of payload.options) {
            content += `- ${option.label}\n`
          }

          await sendEmail({
            ctx,
            content,
            conversation,
            client,
            ack,
            inReplyTo: state.payload.inReplyTo,
          })
        },
      },
    },
  },
  // eslint-disable-next-line max-lines-per-function
  handler: async (props) => {
    console.info('handler received a request')

    if (props.req.path.startsWith('/oauth')) {
      return onOAuth(props)
    }

    await onNewEmail(props)
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

type handlerProps = Parameters<ConstructorParameters<typeof bp.Integration>['0']['handler']>['0']

// eslint-disable-next-line complexity
async function onNewEmail(props: handlerProps) {
  const { req, client, ctx } = props
  const bodyContent = JSON.parse(req.body || '{}')

  const data = bodyContent.message?.data
  console.info('data', data)

  if (!data) {
    console.warn('Handler received an invalid body (no data)')
    return
  }

  const messageData = JSON.parse(decode(data))
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
  const gmail = await getGmailClient({ client, ctx })

  const {
    state: { payload },
  } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const lastHistoryId = payload.lastHistoryId ?? fakeHistoryId(historyId)

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

  const history = await getHistory(props, gmail, lastHistoryId, payload.refreshToken)

  console.info(JSON.stringify(history.data, null, 2))

  const messageIds = history.data.history?.reduce((acc, h) => {
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

  await Promise.all(messageIds.map((id) => processMessage(props, id, gmail, emailAddress)))

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

async function getHistory(
  { client, ctx }: handlerProps,
  gmail: gmail_v1.Gmail,
  lastHistoryId: string,
  refreshToken: string
) {
  try {
    return await gmail.users.history.list({
      startHistoryId: lastHistoryId,
      historyTypes: ['messageAdded'],
      userId: 'me',
    })
  } catch (e) {
    await client.setState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: {
        refreshToken,
      },
    })

    console.error('Error while fetching history', e)
    throw e
  }
}

async function processMessage(
  { client }: handlerProps,
  messageId: string,
  gmail: gmail_v1.Gmail,
  emailAddress: string
) {
  console.info('getting history')
  const gmailMessage = await gmail.users.messages.get({ id: messageId, userId: 'me' })

  const message = parseMessage(gmailMessage.data)
  console.info('message', message)

  const threadId = message.threadId

  if (!threadId) {
    console.info('Handler received an empty chat id')
    throw new Error('Handler received an empty chat id')
  }

  const replyTo = message.headers['reply-to']
  const inReplyTo = message.headers['message-id']
  const from = message.headers['from']
  const userEmail = replyTo ?? /(?<=\<)(.*?)(?=\>)/.exec(from)?.[0] ?? from
  console.info('userEmail', userEmail)

  if (userEmail === emailAddress) {
    return
  }

  console.info('threadId', threadId)
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      [idTag]: `${threadId}`,
    },
  })

  console.info('conversation', conversation)

  const { conversation: updatedConversation } = await client.updateConversation({
    id: conversation.id,
    participantIds: [],
    tags: {
      [subjectTag]: message.headers['subject'],
      [emailTag]: userEmail,
      [referencesTag]: message.headers['references'],
      [ccTag]: message.headers['cc'],
    },
  })

  console.info('updatedConversation', updatedConversation)

  if (!userEmail) {
    throw new Error('Handler received an empty from id')
  }

  console.info('userEmail', userEmail)
  const { user } = await client.getOrCreateUser({
    tags: {
      [idTag]: `${userEmail}`,
    },
  })

  let content = message.textPlain ?? message.snippet

  try {
    const $ = cheerio.load(message.textHtml)
    $('.gmail_quote').remove() // Remove previous quoted messages in the thread
    content = $.text()
  } catch (e) {
    console.error('Error while parsing html content', e)
  }

  console.info('getOrCreateMessage', { threadId, userEmail, content, inReplyTo })
  await client.getOrCreateMessage({
    tags: { [idTag]: messageId },
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

async function onOAuth({ req, client, ctx }: handlerProps) {
  const redirectUri = `${process.env.BP_WEBHOOK_URL}/oauth`

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  const { code } = queryString.parse(req.query)

  if (!code) {
    console.error('Error extracting code from url')
    return
  }

  console.info('code', code)
  const { tokens } = await oauth2Client.getToken({
    code: code.toString(),
  })
  console.info('tokens', tokens)

  oauth2Client.setCredentials({ refresh_token: tokens.refresh_token })
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const profile = await gmail.users.getProfile({
    userId: 'me',
  })

  const userEmail = profile.data.emailAddress
  console.info('userEmail', userEmail)

  if (!userEmail) {
    console.error('Error extracting email from profile')
    return
  }

  console.info('configureIntegration')
  await client.configureIntegration({
    identifier: userEmail,
  })

  await Promise.all([
    client.setState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: { refreshToken: tokens.refresh_token! },
    }),
    gmail.users.watch({
      userId: 'me',
      requestBody: { topicName },
    }),
  ])
}

function fakeHistoryId(historyId: string) {
  return `${Number(historyId) - 100}`
}

function getConversationInfo(conversation: Conversation) {
  const threadId = conversation.tags?.[idTag]
  const subject = conversation.tags?.[subjectTag]
  const email = conversation.tags?.[emailTag]
  const references = conversation.tags?.[referencesTag]
  const cc = conversation.tags?.[ccTag]

  if (!(threadId && subject && email)) {
    console.info(`No valid information found for conversation ${conversation.id}`)
    throw Error(`No valid information found for conversation ${conversation.id}`)
  }

  return { threadId, subject, email, references, cc }
}

async function sendEmail({ client, ctx, conversation, ack, content, inReplyTo }: any) {
  console.info('bulding the client')

  const gmail = await getGmailClient({ client, ctx })

  const { threadId, email, subject, references, cc } = getConversationInfo(conversation)

  console.info('Creating mail')
  const raw = await createMail({
    to: email,
    subject,
    text: content,
    html: content,
    textEncoding: 'base64',
    inReplyTo,
    references: references ?? inReplyTo,
    cc,
  })
  console.info('Sending mail', raw)

  const res = await gmail.users.messages.send({ requestBody: { threadId, raw }, userId: 'me' })
  console.info('Response', res)

  ack({ tags: { [idTag]: `${res.data.id}` } })
}

async function getGmailClient({ client, ctx }: any) {
  const {
    state: { payload },
  } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, `${payload.webhookUrl}/oauth2callback`)

  console.info('integration state payload', payload)

  oauth2Client.setCredentials({ refresh_token: payload.refreshToken })
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  return gmail
}

async function createMail(options: Mail.Options) {
  const mailComposer = new MailComposer(options)
  const message = await mailComposer.compile().build()
  return encodeMessage(message)
}

function encodeMessage(message: Buffer) {
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

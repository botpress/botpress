import { getMessages } from './imap'
import { sendNodemailerMail } from './smtp'
import * as bp from '.botpress'

const DEFAULT_START_PAGE = 0
const DEFAULT_PER_PAGE = 50

export const listEmails = async (props: bp.ActionProps['listEmails']) => {
  const page = props.input.page ?? DEFAULT_START_PAGE
  const perPage = props.input.perPage ?? DEFAULT_PER_PAGE
  const messages = await getMessages(
    { page, perPage },
    {
      integrationConfig: props.ctx.configuration,
      logger: props.logger,
    }
  )
  return { messages }
}

export const syncEmails = async (props: bp.ActionProps['syncEmails']) => {
  const res = await _syncEmails(props, { enableNewMessageNotification: true })
  props.logger.forBot().info(`Synced the messages in the inbox at [${new Date().toISOString()}]`)
  return res
}

export const _syncEmails = async (
  props: { ctx: bp.Context; client: bp.Client; logger: bp.Logger },
  options: { enableNewMessageNotification: boolean }
) => {
  const {
    state: { payload: seenMessages },
  } = await props.client.getOrSetState({
    name: 'seenMails',
    id: props.ctx.integrationId,
    type: 'integration',
    payload: { seenMails: [] },
  })
  const allMessages = await getMessages(
    { page: DEFAULT_START_PAGE, perPage: DEFAULT_PER_PAGE },
    {
      integrationConfig: props.ctx.configuration,
      logger: props.logger,
    },
    { bodyNeeded: options.enableNewMessageNotification }
  )
  for (const message of allMessages) {
    if (message.sender === props.ctx.configuration.user) continue

    const messageAlreadySeen = seenMessages.seenMails.some((m) => m.id === message.id)
    if (messageAlreadySeen) continue

    if (options.enableNewMessageNotification) {
      props.logger.forBot().info(`Detecting a new email from '${message.sender}': ${message.subject}`)
      await notifyNewMessage(props, message)
    }
  }

  await props.client.setState({
    name: 'seenMails',
    id: props.ctx.integrationId,
    type: 'integration',
    payload: {
      seenMails: _unique([
        //
        ...seenMessages.seenMails.map((m) => m.id),
        ...allMessages.map((m) => m.id),
      ]).map((id) => ({ id })),
    },
  })

  return {}
}

const notifyNewMessage = async (
  props: { client: bp.Client; logger: bp.Logger },
  message: bp.actions.listEmails.output.Output['messages'][0]
) => {
  const { user } = await props.client.getOrCreateUser({
    tags: { email: message.sender },
  })

  const firstMessageId = message.firstMessageId || message.id

  const { conversation } = await props.client.getOrCreateConversation({
    channel: 'default',
    tags: {
      firstMessageId,
      subject: message.subject,
      to: user.tags.email,
      latestEmail: message.id,
    },
    discriminateByTags: ['firstMessageId'],
  })
  props.logger
    .forBot()
    .info(
      `Created conversation with id '${conversation.tags.firstMessageId}' and subject '${conversation.tags.subject}'.`
    )

  await props.client.createMessage({
    conversationId: conversation.id,
    userId: user.id,
    payload: { text: message.body },
    tags: { id: message.id },
    type: 'text',
  })
}

export const sendEmail = async (props: bp.ActionProps['sendEmail']) => {
  return await sendNodemailerMail(props.ctx.configuration, props.input)
}

const _unique = <T>(arr: T[]) => Array.from(new Set(arr))

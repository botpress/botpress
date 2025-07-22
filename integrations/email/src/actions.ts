import * as sdk from '@botpress/sdk'
import * as imap from './imap'
import * as locking from './locking'
import * as smtp from './smtp'
import * as bp from '.botpress'

const DEFAULT_START_PAGE = 0
const ELEMENTS_PER_PAGE = 50

export const sendEmail: bp.IntegrationProps['actions']['sendEmail'] = async (props) => {
  return await smtp.sendNodemailerMail(props.ctx.configuration, props.input, props.logger)
}

export const listEmails: bp.IntegrationProps['actions']['listEmails'] = async (props) => {
  const page = parseInt(props.input.nextToken ?? DEFAULT_START_PAGE.toString())
  if (page < 0) {
    throw new sdk.RuntimeError('The nextToken value cannot be negative')
  }
  const perPage = ELEMENTS_PER_PAGE
  const messages = await imap.getMessages(
    { page, perPage },
    {
      ctx: props.ctx,
      logger: props.logger,
    },
    { bodyNeeded: false }
  )
  return messages
}

export const getEmail: bp.IntegrationProps['actions']['getEmail'] = async (props) => {
  const email = await imap.getMessageById(props.input.id, props)
  if (!email) throw new sdk.RuntimeError('Could not find an email with corresponding id.')
  return email
}

export const syncEmails: bp.IntegrationProps['actions']['syncEmails'] = async (props) => {
  props.logger.forBot().info(`Starting sync in the inbox at [${new Date().toISOString()}]`)
  await _syncEmails(props, { enableNewMessageNotification: true })
  props.logger.forBot().info(`Finished sync in the inbox at [${new Date().toISOString()}]`)

  return {}
}

const _syncEmails = async (
  props: { ctx: bp.Context; client: bp.Client; logger: bp.Logger },
  options: { enableNewMessageNotification: boolean }
) => {
  const lock = new locking.LockHandler({ client: props.client, ctx: props.ctx })

  const currentlySyncing = await lock.readLock()
  if (currentlySyncing) throw new sdk.RuntimeError('The bot is still syncing the messages. Try again later.')
  await lock.setLock(true)

  const {
    state: { payload: lastSyncTimestamp },
  } = await props.client.getState({
    name: 'lastSyncTimestamp',
    id: props.ctx.integrationId,
    type: 'integration',
  })

  const allMessages = await imap.getMessages(
    { page: DEFAULT_START_PAGE, perPage: ELEMENTS_PER_PAGE },
    {
      ctx: props.ctx,
      logger: props.logger,
    },
    { bodyNeeded: options.enableNewMessageNotification }
  )

  for (const message of allMessages.messages) {
    if (message.sender === props.ctx.configuration.user) continue

    const messageAlreadySeen =
      message.date && lastSyncTimestamp && new Date(message.date) <= new Date(lastSyncTimestamp.lastSyncTimestamp)
    if (messageAlreadySeen) continue

    if (options.enableNewMessageNotification) {
      props.logger.forBot().info(`Detecting a new email from '${message.sender}': ${message.subject}`)
      await _notifyNewMessage(props, message)
    }
  }

  await props.client.setState({
    name: 'lastSyncTimestamp',
    id: props.ctx.integrationId,
    type: 'integration',
    payload: {
      lastSyncTimestamp: new Date().toISOString(),
    },
  })

  await lock.setLock(false)

  return {}
}

const _notifyNewMessage = async (props: { client: bp.Client; logger: bp.Logger }, message: imap.Email) => {
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
      `Retrieved or created conversation with id '${conversation.tags.firstMessageId}' and subject '${conversation.tags.subject}'.`
    )

  await props.client.createMessage({
    conversationId: conversation.id,
    userId: user.id,
    payload: { text: message.body ?? '' },
    tags: { id: message.id },
    type: 'text',
  })
}

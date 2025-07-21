import * as sdk from '@botpress/sdk'
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
  props.logger.forBot().info(`Starting sync in the inbox at [${new Date().toISOString()}]`)
  const res = await _syncEmails(props, { enableNewMessageNotification: true })
  props.logger.forBot().info(`Finished sync in the inbox at [${new Date().toISOString()}]`)
  return res
}

export const register = async (props: { client: bp.Client; ctx: bp.Context; logger: bp.Logger }) => {
  await _setlock({ client: props.client, ctx: props.ctx }, false)
  await props.client.setState({
    name: 'lastSyncTimestamp',
    id: props.ctx.integrationId,
    type: 'integration',
    payload: { lastSyncTimestamp: new Date() },
  })

  props.logger.forBot().info('Finished syncing to the inbox for the first time')
}

export const _syncEmails = async (
  props: { ctx: bp.Context; client: bp.Client; logger: bp.Logger },
  options: { enableNewMessageNotification: boolean }
) => {
  const currentlySyncing = await _readLock(props)
  if (currentlySyncing) throw new sdk.RuntimeError('The bot is still syncing the messages. Try again later.')
  await _setlock(props, true)

  const {
    state: { payload: lastSyncTimestamp },
  } = await props.client.getOrSetState({
    name: 'lastSyncTimestamp',
    id: props.ctx.integrationId,
    type: 'integration',
    payload: { lastSyncTimestamp: new Date() },
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

    const messageAlreadySeen =
      message.date && lastSyncTimestamp && message.date <= new Date(lastSyncTimestamp.lastSyncTimestamp)
    if (messageAlreadySeen) continue

    if (options.enableNewMessageNotification) {
      props.logger.forBot().info(`Detecting a new email from '${message.sender}': ${message.subject}`)
      await notifyNewMessage(props, message)
    }
  }

  await props.client.setState({
    name: 'lastSyncTimestamp',
    id: props.ctx.integrationId,
    type: 'integration',
    payload: {
      lastSyncTimestamp: new Date(),
    },
  })

  await _setlock(props, false)

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
      `Retrieved or created conversation with id '${conversation.tags.firstMessageId}' and subject '${conversation.tags.subject}'.`
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
  return await sendNodemailerMail(props.ctx.configuration, props.input, props.logger)
}

const _setlock = async (props: { client: bp.Client; ctx: bp.Context }, value: boolean) => {
  await props.client.getOrSetState({
    name: 'syncLock',
    id: props.ctx.integrationId,
    type: 'integration',
    payload: {
      currentlySyncing: value,
    },
  })
}

const _readLock = async (props: { client: bp.Client; ctx: bp.Context }): Promise<boolean> => {
  const syncLock = await props.client.getState({
    name: 'syncLock',
    id: props.ctx.integrationId,
    type: 'integration',
  })
  return syncLock.state.payload.currentlySyncing ?? false
}

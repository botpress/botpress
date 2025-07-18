import 'dotenv/config'
import nodemailer from 'nodemailer'
import { getMessages } from './imapReader'
import * as bp from '.botpress'

export const actions = {
  listEmails: async (props) => {
    // TODO: add paging mechanism
    const messages = await getMessages('1:*', { integrationConfig: props.ctx.configuration, logger: props.logger })
    return { messages }
  },

  syncEmails: async (props) => {
    const {
      state: { payload: seenMessages },
    } = await props.client.getOrSetState({
      name: 'seenMails',
      id: props.ctx.integrationId,
      type: 'integration',
      payload: { seenMails: [] },
    })

    const allMessages = await getMessages('1:*', { integrationConfig: props.ctx.configuration, logger: props.logger })
    for (const message of allMessages) {
      if (message.sender === props.ctx.configuration.user) continue

      const messageAlreadySeen = seenMessages.seenMails.some((m) => m.id === message.id)
      if (messageAlreadySeen) continue
      props.logger.forBot().info(`Detecting a new email from '${message.sender}'`)

      const { user } = await props.client.getOrCreateUser({
        tags: { email: message.sender },
      })

      let firstMessageId: string
      if (message.firstMessageId) {
        firstMessageId = message.firstMessageId
      } else {
        firstMessageId = message.id
      }

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
  },
  sendEmail: async (props) => {
    return await sendNodemailerMail(props.ctx.configuration, props.input)
  },
} as const satisfies bp.IntegrationProps['actions']

export const sendNodemailerMail = async (
  config: { user: string; password: string },
  props: bp.actions.sendMail.input.Input
) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.user,
      pass: config.password,
    },
  })

  await transporter.sendMail({
    from: config.user,
    ...props,
  })
  return { message: 'Success' }
}

const _unique = <T>(arr: T[]) => Array.from(new Set(arr))

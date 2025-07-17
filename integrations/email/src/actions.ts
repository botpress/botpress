import 'dotenv/config'
import { SendMailProps } from 'integration.definition'
import nodemailer from 'nodemailer'
import { getMessages } from './imapReader'
import * as bp from '.botpress'

export const actions = {
  listEmails: async (props) => {
    // TODO: add paging mechanism
    const messages = await getMessages('1:*', props)
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

    const allMessages = await getMessages('1:*', props)
    for (const message of allMessages) {
      const messageAlreadySeen = seenMessages.seenMails.some((m) => m.id === message.id)
      if (messageAlreadySeen) {
        continue
      }

      const { user } = await props.client.getOrCreateUser({
        tags: { email: message.sender },
      })

      const { conversation } = await props.client.getOrCreateConversation({
        channel: 'default',
        tags: {
          subject: message.subject,
          to: user.tags.email,
          latestEmail: message.id,
        },
      })
      props.logger.forBot().info("created conversation '" + conversation.tags.subject + "'.")

      await props.client.createMessage({
        conversationId: conversation.id,
        userId: user.id,
        payload: { text: message.body },
        tags: {},
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
  sendMail: async (props) => {
    return await sendNodemailerMail(props.ctx.configuration, props.input)
  },
} as const satisfies bp.IntegrationProps['actions']

export const sendNodemailerMail = async (config: { user: any; password: any }, props: SendMailProps) => {
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

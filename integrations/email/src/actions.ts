import 'dotenv/config'
import nodemailer from 'nodemailer'
import { getMessages } from './imapReader'
import * as bp from '.botpress'

export const actions = {
  listEmails: async (props) => {
    const messages = await getMessages('1:*', props)

    for (const message of messages) {
      // const user = await props.client.getOrCreateUser({
      //   tags: { email: message.sender },
      //   discriminateByTags: ['email'],
      // })
      // const conversation = await props.client.getOrCreateConversation({ channel: 'default', tags: [] })
      // const message = props.client.getOrCreateMessage({
      //   conversationId: conversation.conversation.id,
      //   payload: { text: '' },
      //   tags: [],
      //   type: 'text',
      //   userId: user.user.id,
      // })
    }

    return { messages }
  },

  syncEmails: async (props) => {
    const messages = await getMessages('1:*', props)

    const ids = []
    for (const { id } of messages) {
      ids.push({ id })
    }
    const seenMessages = await props.client.getOrSetState({
      name: 'seenMails',
      id: props.ctx.integrationId,
      type: 'integration',
      payload: { seenMails: [] },
    })

    const unseenMessages = []
    for (const message of messages) {
      if (!seenMessages.state.payload.seenMails.some((mail: { id: string }) => mail.id === message.id)) {
        unseenMessages.push(message)
      }
    }
    await props.client.setState({
      name: 'seenMails',
      id: props.ctx.integrationId,
      type: 'integration',
      payload: { seenMails: ids },
    })

    return { messages: unseenMessages }
  },
  sendMail: async (props) => {
    return await sendNodemailerMail(props.ctx.configuration, props.input.to, props.input.subject, props.input.text)
  },
} as const satisfies bp.IntegrationProps['actions']

export const sendNodemailerMail = async (
  config: { user: any; password: any },
  to: string,
  subject: string | undefined,
  text: string | undefined
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
    to,
    subject,
    text,
  })
  return { message: 'Success' }
}

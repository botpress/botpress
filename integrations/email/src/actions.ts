import 'dotenv/config'
import nodemailer from 'nodemailer'
import { getMessages } from './imapReader'
import * as bp from '.botpress'

export const actions = {
  listEmails: async (props) => {
    const messages = await getMessages('1:*', props)

    return { messages: messages.flat() }
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
    for (const { id, subject, inReplyTo, body, date } of messages) {
      if (!seenMessages.state.payload.seenMails.some((mail: { id: string }) => mail.id === id)) {
        unseenMessages.push({ id, subject, inReplyTo, body, date }) // Include inReplyTo
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
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: props.ctx.configuration.user,
        pass: props.ctx.configuration.password,
      },
    })

    await transporter.sendMail({
      from: props.input.from,
      to: props.input.to,
      subject: props.input.subject,
      text: props.input.text,
    })
    return { message: 'Success' }
  },
} as const satisfies bp.IntegrationProps['actions']

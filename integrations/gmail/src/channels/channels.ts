import * as sdk from '@botpress/sdk'
import { GoogleClient } from '../google-api'
import { composeRawEmail } from '../utils/mail-composing'
import { wrapChannel } from './channel-wrapper'
import * as bp from '.botpress'

export const channels = {
  channel: {
    messages: {
      image: wrapChannel({ channelName: 'channel', messageType: 'image' }, ({ conversation, message, user }) => {
        console.info('conversation', conversation)
        console.info('message', message)
        console.info('user', user)
        throw new sdk.RuntimeError('Not implemented')
      }),
      markdown: wrapChannel({ channelName: 'channel', messageType: 'markdown' }, ({ conversation, message, user }) => {
        console.info('conversation', conversation)
        console.info('message', message)
        console.info('user', user)
        throw new sdk.RuntimeError('Not implemented')
      }),
      audio: wrapChannel({ channelName: 'channel', messageType: 'audio' }, ({ conversation, message, user }) => {
        console.info('conversation', conversation)
        console.info('message', message)
        console.info('user', user)
        throw new sdk.RuntimeError('Not implemented')
      }),
      video: wrapChannel({ channelName: 'channel', messageType: 'video' }, ({ conversation, message, user }) => {
        console.info('conversation', conversation)
        console.info('message', message)
        console.info('user', user)
        throw new sdk.RuntimeError('Not implemented')
      }),
      file: wrapChannel({ channelName: 'channel', messageType: 'file' }, ({ conversation, message, user }) => {
        console.info('conversation', conversation)
        console.info('message', message)
        console.info('user', user)
        throw new sdk.RuntimeError('Not implemented')
      }),
      location: wrapChannel({ channelName: 'channel', messageType: 'location' }, ({ conversation, message, user }) => {
        console.info('conversation', conversation)
        console.info('message', message)
        console.info('user', user)
        throw new sdk.RuntimeError('Not implemented')
      }),
      card: wrapChannel({ channelName: 'channel', messageType: 'card' }, ({ conversation, message, user }) => {
        console.info('conversation', conversation)
        console.info('message', message)
        console.info('user', user)
        throw new sdk.RuntimeError('Not implemented')
      }),
      carousel: wrapChannel({ channelName: 'channel', messageType: 'carousel' }, ({ conversation, message, user }) => {
        console.info('conversation', conversation)
        console.info('message', message)
        console.info('user', user)
        throw new sdk.RuntimeError('Not implemented')
      }),
      dropdown: wrapChannel({ channelName: 'channel', messageType: 'dropdown' }, ({ conversation, message, user }) => {
        console.info('conversation', conversation)
        console.info('message', message)
        console.info('user', user)
        throw new sdk.RuntimeError('Not implemented')
      }),
      bloc: wrapChannel({ channelName: 'channel', messageType: 'bloc' }, ({ conversation, message, user }) => {
        console.info('conversation', conversation)
        console.info('message', message)
        console.info('user', user)
        throw new sdk.RuntimeError('Not implemented')
      }),
      text: wrapChannel(
        { channelName: 'channel', messageType: 'text' },
        async ({ ctx, client, conversation, ack, payload }) => {
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

          await _sendEmailReply({
            ctx,
            content: payload.text,
            conversation,
            client,
            ack,
            inReplyTo: state.payload.inReplyTo,
          })
        }
      ),
      choice: wrapChannel(
        { channelName: 'channel', messageType: 'choice' },
        async ({ client, conversation, ctx, payload, ack }) => {
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

          await _sendEmailReply({
            ctx,
            content,
            conversation,
            client,
            ack,
            inReplyTo: state.payload.inReplyTo,
          })
        }
      ),
    },
  },
} as const satisfies bp.IntegrationProps['channels']

type SendEmailProps = Pick<bp.AnyMessageProps, 'ctx' | 'conversation' | 'client' | 'ack'> & {
  content: string
  inReplyTo: string
}

const _sendEmailReply = async ({ client, ctx, conversation, ack, content, inReplyTo }: SendEmailProps) => {
  console.info('bulding the client')

  const googleClient = await GoogleClient.create({ client, ctx })

  const { threadId, email, subject, references, cc } = _getConversationInfo(conversation)

  console.info('Creating mail')
  const raw = await composeRawEmail({
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

  const res = await googleClient.sendRawEmail(raw, threadId)
  console.info('Response', res)

  await ack({ tags: { id: `${res.id}` } })
}

const _getConversationInfo = (conversation: bp.AnyMessageProps['conversation']) => {
  const threadId = conversation.tags?.id
  const subject = conversation.tags?.subject
  const email = conversation.tags?.email
  const references = conversation.tags?.references
  const cc = conversation.tags?.cc

  if (!(threadId && subject && email)) {
    console.info(`No valid information found for conversation ${conversation.id}`)
    throw Error(`No valid information found for conversation ${conversation.id}`)
  }

  return { threadId, subject, email, references, cc }
}

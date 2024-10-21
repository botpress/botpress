import * as sdk from '@botpress/sdk'
import { GoogleClient } from '../google-api'
import {
  composeRawEmail,
  generateAudioMessage,
  generateFileDownloadMessage,
  generateImageMessage,
  generateVideoMessage,
} from '../utils/mail-composing'
import { wrapChannel } from './channel-wrapper'
import * as bp from '.botpress'

export const channels = {
  channel: {
    messages: {
      image: wrapChannel({ channelName: 'channel', messageType: 'image' }, (props) => {
        const { imageUrl, title: altText } = props.payload
        const htmlContent = generateImageMessage({ imageUrl, altText })
        const textContent = `Image:\n${imageUrl}`

        return _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
      }),
      audio: wrapChannel({ channelName: 'channel', messageType: 'audio' }, (props) => {
        const { audioUrl, title } = props.payload
        const htmlContent = generateAudioMessage({ audioUrl, title })
        const textContent = `Audio file:\n${audioUrl}`

        return _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
      }),
      video: wrapChannel({ channelName: 'channel', messageType: 'video' }, (props) => {
        const { videoUrl, title } = props.payload
        const htmlContent = generateVideoMessage({ videoUrl, title })
        const textContent = `Video file:\n${videoUrl}`

        return _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
      }),
      file: wrapChannel({ channelName: 'channel', messageType: 'file' }, (props) => {
        const { fileUrl, title } = props.payload
        const htmlContent = generateFileDownloadMessage({ fileUrl, title })
        const textContent = `Linked file:\n${fileUrl}`

        return _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
      }),
      text: wrapChannel({ channelName: 'channel', messageType: 'text' }, async (props) => {
        const { text: textContent } = props.payload

        await _sendEmailReply({
          ...props,
          textContent,
        })
      }),
      choice: wrapChannel({ channelName: 'channel', messageType: 'choice' }, async (props) => {
        const { text, options } = props.payload
        let content = `${text}\n`

        for (const option of options) {
          content += `- ${option.label}\n`
        }

        await _sendEmailReply({
          ...props,
          textContent: content,
        })
      }),
      markdown: wrapChannel({ channelName: 'channel', messageType: 'markdown' }, () => {
        throw new sdk.RuntimeError('This message type is not yet implemented')
      }),
      location: wrapChannel({ channelName: 'channel', messageType: 'location' }, () => {
        throw new sdk.RuntimeError('This message type is not yet implemented')
      }),
      card: wrapChannel({ channelName: 'channel', messageType: 'card' }, () => {
        throw new sdk.RuntimeError('This message type is not yet implemented')
      }),
      carousel: wrapChannel({ channelName: 'channel', messageType: 'carousel' }, () => {
        throw new sdk.RuntimeError('This message type is not yet implemented')
      }),
      dropdown: wrapChannel({ channelName: 'channel', messageType: 'dropdown' }, () => {
        throw new sdk.RuntimeError('This message type is not yet implemented')
      }),
      bloc: wrapChannel({ channelName: 'channel', messageType: 'bloc' }, () => {
        throw new sdk.RuntimeError('This message type is not yet implemented')
      }),
    },
  },
} as const satisfies bp.IntegrationProps['channels']

const _sendEmailReply = async ({
  conversation,
  ack,
  textContent,
  htmlContent,
  inReplyTo,
  googleClient,
}: bp.AnyMessageProps & {
  textContent: string
  htmlContent?: string
  inReplyTo: string
  googleClient: GoogleClient
}) => {
  const { threadId, email, subject, references, cc } = _getConversationInfo(conversation)

  console.info('Creating mail')
  const raw = await composeRawEmail({
    to: email,
    subject,
    text: textContent,
    html: htmlContent ?? textContent,
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
  const { id, tags } = conversation
  const { id: threadId, subject, email, references, cc } = tags

  if (!(threadId && subject && email)) {
    console.info(`No valid information found for conversation ${id}`)
    throw new Error(`No valid information found for conversation ${id}`)
  }

  return { threadId, subject, email, references, cc }
}

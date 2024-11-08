import * as sdk from '@botpress/sdk'
import { GoogleClient } from '../google-api'
import {
  composeRawEmail,
  generateAudioMessage,
  generateCardMessage,
  generateCarouselMessage,
  generateFileDownloadMessage,
  generateImageMessage,
  generateLocationMessage,
  generateMarkdownMessage,
  generateVideoMessage,
} from '../utils/mail-composing'
import { wrapChannel } from './channel-wrapper'
import * as bp from '.botpress'

export const channels = {
  channel: {
    messages: {
      image: wrapChannel({ channelName: 'channel', messageType: 'image' }, (props) => {
        const { imageUrl, title: altText } = props.payload
        const htmlContent = generateImageMessage({ imageUrl, altText: altText ?? 'image' })
        const textContent = `Image:\n${imageUrl}`

        return _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
      }),
      audio: wrapChannel({ channelName: 'channel', messageType: 'audio' }, (props) => {
        const { audioUrl, title } = props.payload
        const htmlContent = generateAudioMessage({ audioUrl, title: title ?? 'Play audio file' })
        const textContent = `Audio file:\n${audioUrl}`

        return _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
      }),
      video: wrapChannel({ channelName: 'channel', messageType: 'video' }, (props) => {
        const { videoUrl, title } = props.payload
        const htmlContent = generateVideoMessage({ videoUrl, title: title ?? 'Play video file' })
        const textContent = `Video file:\n${videoUrl}`

        return _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
      }),
      file: wrapChannel({ channelName: 'channel', messageType: 'file' }, (props) => {
        const { fileUrl, title } = props.payload
        const htmlContent = generateFileDownloadMessage({ fileUrl, title: title ?? 'Download file' })
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
      markdown: wrapChannel({ channelName: 'channel', messageType: 'markdown' }, async (props) => {
        const { markdown } = props.payload
        const htmlContent = generateMarkdownMessage({ markdown })
        const textContent = markdown

        await _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
      }),
      location: wrapChannel({ channelName: 'channel', messageType: 'location' }, async (props) => {
        const { latitude, longitude, address, title } = props.payload
        const htmlContent = generateLocationMessage({ latitude, longitude, address, title })
        const textContent = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

        await _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
      }),
      card: wrapChannel({ channelName: 'channel', messageType: 'card' }, async (props) => {
        const { title, subtitle, imageUrl, actions } = props.payload

        const htmlContent = generateCardMessage({ title, subtitle: subtitle ?? '', imageUrl: imageUrl ?? '', actions })
        const textContent = `${title}\n${subtitle}\n\n${actions.map((a) => `${a.label}: ${a.value}`).join('\n')}`

        await _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
      }),
      carousel: wrapChannel({ channelName: 'channel', messageType: 'carousel' }, async (props) => {
        const { items: cards } = props.payload

        const htmlContent = generateCarouselMessage({
          cards: cards.map((c) => ({ ...c, subtitle: c.subtitle ?? '', imageUrl: c.imageUrl ?? '' })),
        })
        const textContent = cards
          .map((c) => `${c.title}\n${c.subtitle}\n\n${c.actions.map((a) => `${a.label}: ${a.value}`).join('\n')}`)
          .join('\n\n\n')

        await _sendEmailReply({
          ...props,
          textContent,
          htmlContent,
        })
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

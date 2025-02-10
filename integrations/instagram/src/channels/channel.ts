import { RuntimeError } from '@botpress/sdk'
import { sendMessage } from 'src/misc/outgoing-message'
import { formatGoogleMapLink, getCarouselMessage, getChoiceMessage } from 'src/misc/utils'
import * as bp from '.botpress'

export const channel: bp.IntegrationProps['channels']['channel'] = {
  messages: {
    text: async ({ payload, ...props }) =>
      sendMessage(props, async (client, recipientId) => {
        props.logger.forBot().debug('Sending text message from bot to Instagram:', payload.text)
        return client.sendTextMessage(recipientId, payload.text)
      }),
    image: async ({ payload, ...props }) =>
      sendMessage(props, async (client, recipientId) => {
        props.logger.forBot().debug('Sending image message from bot to Instagram:', payload.imageUrl)
        return client.sendImageMessage(recipientId, payload.imageUrl)
      }),
    markdown: async ({ payload, ...props }) =>
      sendMessage(props, async (instagram, recipientId) => {
        props.logger.forBot().debug('Sending markdown message from bot to Instagram:', payload.markdown)
        return instagram.sendTextMessage(recipientId, payload.markdown)
      }),
    audio: async ({ payload, ...props }) =>
      sendMessage(props, async (client, recipientId) => {
        props.logger.forBot().debug('Sending audio message from bot to Instagram:', payload.audioUrl)
        return client.sendAudioMessage(recipientId, payload.audioUrl)
      }),
    video: async ({ payload, ...props }) =>
      sendMessage(props, async (client, recipientId) => {
        props.logger.forBot().debug('Sending video message from bot to Instagram:', payload.videoUrl)
        return client.sendVideoMessage(recipientId, payload.videoUrl)
      }),
    file: async ({ payload, ...props }) =>
      sendMessage(props, async (client, recipientId) => {
        props.logger.forBot().debug('Sending file message from bot to Instagram:', payload.fileUrl)
        return client.sendFileMessage(recipientId, payload.fileUrl)
      }),
    location: async ({ payload, ...props }) =>
      sendMessage(props, async (client, recipientId) => {
        const googleMapLink = formatGoogleMapLink(payload)
        props.logger.forBot().debug('Sending location message from bot to Instagram:', googleMapLink)
        return client.sendTextMessage(recipientId, googleMapLink)
      }),
    carousel: async ({ payload, ...props }) =>
      sendMessage(props, async (instagram, recipientId) => {
        const carouselMessage = getCarouselMessage(payload)
        props.logger.forBot().debug('Sending carousel message from bot to Instagram:', carouselMessage)
        return instagram.sendMessage(recipientId, getCarouselMessage(payload))
      }),
    card: async ({ payload, ...props }) =>
      sendMessage(props, async (instagram, recipientId) => {
        const cardMessage = getCarouselMessage({ items: [payload] })
        props.logger.forBot().debug('Sending card message from bot to Instagram:', cardMessage)
        return instagram.sendMessage(recipientId, cardMessage)
      }),
    dropdown: async ({ payload, ...props }) =>
      sendMessage(props, async (instagram, recipientId) => {
        const choiceMessage = getChoiceMessage(payload)
        props.logger.forBot().debug('Sending dropdown message from bot to Instagram:', choiceMessage)
        return instagram.sendMessage(recipientId, choiceMessage)
      }),
    choice: async ({ payload, ...props }) =>
      sendMessage(props, async (instagram, recipientId) => {
        const choiceMessage = getChoiceMessage(payload)
        props.logger.forBot().debug('Sending choice message from bot to Instagram:', choiceMessage)
        return instagram.sendMessage(recipientId, getChoiceMessage(payload))
      }),
    bloc: () => {
      throw new RuntimeError('Not implemented')
    },
  },
}

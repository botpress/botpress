import { RuntimeError } from '@botpress/sdk'
import { sendMessage } from '../misc/outgoing-message'
import { formatGoogleMapLink, getCarouselMessage, getChoiceMessage } from '../misc/utils'
import * as bp from '.botpress'

const channel: bp.IntegrationProps['channels']['channel'] = {
  messages: {
    text: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending text message from bot to Messenger:', payload.text)
        return messenger.sendText(recipientId, payload.text)
      }),
    image: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending image message from bot to Messenger:', payload.imageUrl)
        return messenger.sendImage(recipientId, payload.imageUrl)
      }),
    markdown: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending markdown message from bot to Messenger:', payload.markdown)
        return messenger.sendText(recipientId, payload.markdown)
      }),
    audio: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending audio message from bot to Messenger:', payload.audioUrl)
        return messenger.sendAudio(recipientId, payload.audioUrl)
      }),
    video: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending video message from bot to Messenger:', payload.videoUrl)
        return messenger.sendVideo(recipientId, payload.videoUrl)
      }),
    file: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending file message from bot to Messenger:', payload.fileUrl)
        return messenger.sendFile(recipientId, payload.fileUrl)
      }),
    location: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        const googleMapLink = formatGoogleMapLink(payload)

        props.logger.forBot().debug('Sending location message from bot to Messenger:', googleMapLink)
        return messenger.sendText(recipientId, googleMapLink)
      }),
    carousel: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        const carouselMessage = getCarouselMessage(payload)

        props.logger.forBot().debug('Sending carousel message from bot to Messenger:', carouselMessage)
        return messenger.sendMessage(recipientId, getCarouselMessage(payload))
      }),
    card: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        const cardMessage = getCarouselMessage({ items: [payload] })

        props.logger.forBot().debug('Sending card message from bot to Messenger:', cardMessage)
        return messenger.sendMessage(recipientId, cardMessage)
      }),
    dropdown: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        const choiceMessage = getChoiceMessage(payload)

        props.logger.forBot().debug('Sending dropdown message from bot to Messenger:', choiceMessage)
        return messenger.sendMessage(recipientId, choiceMessage)
      }),
    choice: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        const choiceMessage = getChoiceMessage(payload)

        props.logger.forBot().debug('Sending choice message from bot to Messenger:', choiceMessage)
        return messenger.sendMessage(recipientId, getChoiceMessage(payload))
      }),
    bloc: () => {
      throw new RuntimeError('Not implemented')
    },
  },
}

export default channel

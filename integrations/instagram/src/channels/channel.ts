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
    bloc: async ({ payload, ...props }) => {
      props.logger.forBot().debug('Sending bloc message from bot to Instagram:', payload.items)
      for (const item of payload.items) {
        const logMessage = `Sending bloc item of type ${item.type} from bot to Instagram:`
        if (item.type === 'text') {
          await sendMessage(props, async (instagram, recipientId) => {
            props.logger.forBot().debug(logMessage, item.payload.text)
            return instagram.sendTextMessage(recipientId, item.payload.text)
          })
        } else if (item.type === 'image') {
          await sendMessage(props, async (instagram, recipientId) => {
            props.logger.forBot().debug(logMessage, item.payload.imageUrl)
            return instagram.sendImageMessage(recipientId, item.payload.imageUrl)
          })
        } else if (item.type === 'audio') {
          await sendMessage(props, async (instagram, recipientId) => {
            props.logger.forBot().debug(logMessage, item.payload.audioUrl)
            return instagram.sendAudioMessage(recipientId, item.payload.audioUrl)
          })
        } else if (item.type === 'video') {
          await sendMessage(props, async (instagram, recipientId) => {
            props.logger.forBot().debug(logMessage, item.payload.videoUrl)
            return instagram.sendVideoMessage(recipientId, item.payload.videoUrl)
          })
        } else if (item.type === 'location') {
          await sendMessage(props, async (instagram, recipientId) => {
            const googleMapLink = formatGoogleMapLink(item.payload)
            props.logger.forBot().debug(logMessage, googleMapLink)
            return instagram.sendTextMessage(recipientId, googleMapLink)
          })
        } else {
          props.logger.forBot().warn(`Unsupported bloc item type: ${item.type}`)
        }
      }
    },
  },
}

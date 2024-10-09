import { MessengerClient, MessengerTypes } from 'messaging-api-messenger'
import {
  Card,
  Carousel,
  Choice,
  Dropdown,
  InstagramAttachment,
  InstagramUserProfile,
  IntegrationLogger,
  Location,
} from './types'
import * as bp from '.botpress'
import { getCredentials } from './client'

export async function getMessengerClient(client: bp.Client, ctx: bp.Context) {
  const { accessToken, clientId, clientSecret } = await getCredentials(client, ctx)

  return new MessengerClient({
    accessToken,
    appSecret: clientSecret,
    appId: clientId,
  })
}

export function formatCardElement(payload: Card) {
  const buttons: InstagramAttachment[] = []

  payload.actions.forEach((action) => {
    switch (action.action) {
      case 'postback':
        buttons.push({
          type: 'postback',
          title: action.label,
          payload: `postback:${action.value}`,
        })
        break
      case 'say':
        buttons.push({
          type: 'postback',
          title: action.label,
          payload: `say:${action.value}`,
        })
        break
      case 'url':
        buttons.push({
          type: 'web_url',
          title: action.label,
          url: action.value,
        })
        break
      default:
        break
    }
  })
  return {
    title: payload.title,
    image_url: payload.imageUrl,
    subtitle: payload.subtitle,
    buttons,
  }
}

export function formatGoogleMapLink(payload: Location) {
  return `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
}

export function getCarouselMessage(payload: Carousel): MessengerTypes.AttachmentMessage {
  return {
    attachment: {
      type: 'template',
      payload: {
        templateType: 'generic',
        elements: payload.items.map(formatCardElement),
      },
    },
  }
}

export function getChoiceMessage(payload: Choice | Dropdown): MessengerTypes.TextMessage {
  if (!payload.options.length) {
    return { text: payload.text }
  }

  if (payload.options.length > 13) {
    return {
      text: `${payload.text}\n\n${payload.options.map((o, idx) => `${idx + 1}. ${o.label}`).join('\n')}`,
    }
  }

  return {
    text: payload.text,
    quickReplies: payload.options.map((option) => ({
      contentType: 'text',
      title: option.label,
      payload: option.value,
    })),
  }
}

export const getUserProfile = async (
  messengerClient: MessengerClient,
  userId: string,
  logger: IntegrationLogger
) => {
  try {
    return (await messengerClient.getUserProfile(userId, {
      // username is an available field for instagram ids -> https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-profiles-and-media
      fields: ['id', 'name', 'profile_pic', 'username'] as any,
    })) as InstagramUserProfile
  } catch (error) {
    logger.forBot().debug("profile_pic can't be fetched from instagram, trying without it")
    // if the user is not a business instagram user, this will fail because of profile_pic
    return (await messengerClient.getUserProfile(userId, {
      fields: ['id', 'name', 'username'] as any,
    })) as InstagramUserProfile
  }
}

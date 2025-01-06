import { RuntimeError } from '@botpress/client'
import { Request } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import queryString from 'query-string'
import { INTEGRATION_NAME } from '../integration.definition'
import { getCredentials, MetaClient } from './misc/client'
import { getInterstitialUrl, redirectTo } from './misc/html-utils'
import { handleMessage } from './misc/incoming-message'
import { sendMessage } from './misc/outgoing-message'
import { InstagramPayload } from './misc/types'
import { formatGoogleMapLink, getCarouselMessage, getChoiceMessage } from './misc/utils'
import { handleWizard } from './misc/wizard'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
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
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
    if (detectIdentifierIssue(req, ctx)) {
      return redirectTo(getInterstitialUrl(false, 'Not allowed'))
    }

    if (req.query?.includes('code') || req.query?.includes('wizard-step')) {
      try {
        return await handleWizard(req, client, ctx, logger)
      } catch (err: any) {
        let errorMessage = '(OAuth registration) Error: ' + err.message

        console.log({ err, data: err.response.data })
        if (err.response) {
          errorMessage += '\n Data: ' + JSON.stringify(err.response.data)
        }
        logger.forBot().error(errorMessage)
        return redirectTo(getInterstitialUrl(false, errorMessage))
      }
    }

    logger.forBot().debug('Handler received request from Instagram with payload:', req.body)

    if (req.query) {
      const query: Record<string, string | string[] | null> = queryString.parse(req.query)

      const mode = query['hub.mode']
      const token = query['hub.verify_token']
      const challenge = query['hub.challenge']

      if (mode === 'subscribe') {
        if (token === ctx.configuration.verifyToken) {
          if (!challenge) {
            logger.forBot().warn('Returning HTTP 400 as no challenge parameter was received in query string of request')
            return {
              status: 400,
            }
          }

          return {
            body: typeof challenge === 'string' ? challenge : '',
          }
        } else {
          logger
            .forBot()
            .warn("Returning HTTP 403 as the Instagram token doesn't match the one in the bot configuration")
          return {
            status: 403,
          }
        }
      } else {
        logger.forBot().warn(`Returning HTTP 400 as the '${mode}' mode received in the query string isn't supported`)
        return {
          status: 400,
        }
      }
    }

    if (!req.body) {
      logger.forBot().warn('Handler received an empty body, so the message was ignored')
      return
    }

    try {
      const data = JSON.parse(req.body) as InstagramPayload

      for (const { messaging } of data.entry) {
        for (const message of messaging) {
          if (message.message?.is_echo) {
            continue
          }
          await handleMessage(message, { client, ctx, logger })
        }
      }
    } catch (e: any) {
      logger.forBot().error('Error while handling request:', e)
      logger.forBot().debug('Request body received:', req.body)
    }

    return
  },
  createUser: async ({ client, tags, ctx, logger }) => {
    const userId = tags.id
    if (!userId) {
      return
    }

    const credentials = await getCredentials(client, ctx)
    const metaClient = new MetaClient(logger)
    const userProfile = await metaClient.getUserProfile(credentials.accessToken, userId)

    const { user } = await client.getOrCreateUser({ tags: { id: `${userProfile.id}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx, logger }) => {
    const userId = tags.id
    if (!userId) {
      return
    }

    const credentials = await getCredentials(client, ctx)
    const metaClient = new MetaClient(logger)
    const userProfile = await metaClient.getUserProfile(credentials.accessToken, userId)

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { id: `${userProfile.id}` },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

export const getGlobalWebhookUrl = () => {
  return `${process.env.BP_WEBHOOK_URL}/integration/global/${INTEGRATION_NAME}`
}

export const detectIdentifierIssue = (req: Request, ctx: bp.Context) => {
  /* because of the wizard, we need to accept the query param "state" as an identifier
   * but we need to prevent anyone of using anything other than the webhookId there for security reasons
   */

  const query = queryString.parse(req.query)

  return !!(query['state']?.length && query['state'] !== ctx.webhookId)
}

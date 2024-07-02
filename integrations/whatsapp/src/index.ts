import { RuntimeError } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { channel } from 'integration.definition'
import * as crypto from 'node:crypto'
import queryString from 'query-string'
import WhatsAppAPI from 'whatsapp-api-js'
import { Audio, Document, Image, Location, Text, Video } from 'whatsapp-api-js/messages'
import { createConversationHandler as createConversation, startConversation } from './conversation'
import { handleIncomingMessage } from './incoming-message'
import * as card from './message-types/card'
import * as carousel from './message-types/carousel'
import * as choice from './message-types/choice'
import * as dropdown from './message-types/dropdown'
import { getAccessToken, getPhoneNumberId, getSecret, handleOauth } from './misc/whatsapp'
import * as outgoing from './outgoing-message'
import { WhatsAppPayload } from './whatsapp-types'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    startConversation: async ({ ctx, input, client, logger }) => {
      const phoneNumberId: string | undefined = input.senderPhoneNumberId || (await getPhoneNumberId(client, ctx))

      if (!phoneNumberId) {
        throw new Error('phoneNumberId is required')
      }

      const conversation = await startConversation(
        {
          channel,
          phoneNumberId,
          userPhone: input.userPhone,
          templateName: input.templateName,
          templateLanguage: input.templateLanguage,
          templateVariablesJson: input.templateVariablesJson,
        },
        { client, ctx, logger }
      )

      return {
        conversationId: conversation.id,
      }
    },
  },
  createConversation, // This is not needed for the `startConversation` action above, it's only for allowing bots to start conversations by calling `client.createConversation()` directly.
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ...props }) => {
          await outgoing.send({ ...props, message: new Text(payload.text) })
        },
        image: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Image(payload.imageUrl, false),
          })
        },
        markdown: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Text(payload.markdown),
          })
        },
        audio: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Audio(payload.audioUrl, false),
          })
        },
        video: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Video(payload.videoUrl, false),
          })
        },
        file: async ({ payload, ...props }) => {
          const url = new URL(payload.fileUrl)
          const extension = url.pathname.includes('.') ? url.pathname.split('.').pop()?.toLowerCase() ?? '' : ''
          const filename = 'file' + (extension ? `.${extension}` : '')

          await outgoing.send({
            ...props,
            message: new Document(payload.fileUrl, false, payload.title, filename),
          })
        },
        location: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Location(payload.longitude, payload.latitude),
          })
        },
        carousel: async ({ payload, ...props }) => {
          await outgoing.sendMany({ ...props, generator: carousel.generateOutgoingMessages(payload) })
        },
        card: async ({ payload, ...props }) => {
          await outgoing.sendMany({ ...props, generator: card.generateOutgoingMessages(payload) })
        },
        dropdown: async ({ payload, logger, ...props }) => {
          await outgoing.sendMany({
            ...props,
            logger,
            generator: dropdown.generateOutgoingMessages({ payload, logger }),
          })
        },
        choice: async ({ payload, logger, ...props }) => {
          if (payload.options.length <= choice.INTERACTIVE_MAX_BUTTONS_COUNT) {
            await outgoing.sendMany({
              ...props,
              logger,
              generator: choice.generateOutgoingMessages({ payload, logger }),
            })
          } else {
            // If choice options exceeds the maximum number of buttons allowed by Whatsapp we use a dropdown instead to avoid buttons being split into multiple groups with a repeated message.
            await outgoing.sendMany({
              ...props,
              logger,
              generator: dropdown.generateOutgoingMessages({ payload, logger }),
            })
          }
        },
        bloc: () => {
          throw new RuntimeError('Not implemented')
        },
      },
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
    if (req.path === '/oauth') {
      try {
        return handleOauth(req, client, ctx, logger)
      } catch (err: any) {
        const errorMessage = '(OAuth registration) Error: ' + err.response?.data || err.message
        logger.forBot().error(errorMessage)
        return { status: 500, body: errorMessage }
      }
    }

    if (req.body) {
      logger.forBot().debug('Handler received request from Whatsapp with payload:', req.body)
    } else {
      logger.forBot().debug('Handler received request from Whatsapp with empty payload')
    }

    if (req.query) {
      const query = queryString.parse(req.query)

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
            .warn("Returning HTTP 403 as the Whatsapp token doesn't match the one in the bot configuration")
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

    const secret = getSecret(ctx)
    // For testing purposes, if you send the secret in the header it's possible to disable signature check
    if (req.headers['x-secret'] !== secret) {
      const signature = req.headers['x-hub-signature-256']

      if (!signature) {
        const errorMessage = 'Couldn\'t find "x-hub-signature-256" in headers.'
        logger.forBot().error(errorMessage)
        return { status: 401, body: errorMessage }
      } else {
        const signatureHash = signature.split('=')[1]
        const expectedHash = crypto.createHmac('sha256', secret).update(req.body).digest('hex')
        if (signatureHash !== expectedHash) {
          const errorMessage = "Couldn't validate the request signature."
          logger.forBot().error(errorMessage)
          return { status: 401, body: errorMessage }
        }
      }
    }

    try {
      const data = JSON.parse(req.body) as WhatsAppPayload

      for (const { changes } of data.entry) {
        for (const change of changes) {
          if (!change.value.messages) {
            // If the change doesn't contain messages we can ignore it, as we don't currently process other change types (such as statuses).
            continue
          }

          for (const message of change.value.messages) {
            const accessToken = await getAccessToken(client, ctx)

            const whatsapp = new WhatsAppAPI({ token: accessToken, secure: false })

            const phoneNumberId = change.value.metadata.phone_number_id

            await whatsapp.markAsRead(phoneNumberId, message.id)

            await handleIncomingMessage(message, change.value, ctx, client, logger)
          }
        }
      }
    } catch (e: any) {
      logger.forBot().error('Error while handling request:', e)
      logger.forBot().debug('Request body received:', req.body)
    }

    return
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

import { load as loadHtml } from 'cheerio'
import * as botpress from '.botpress'
import { GraphApi } from './client'
import _ from 'lodash'

type Config = botpress.configuration.Configuration

const logger = console
logger.info('starting integration')

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

export default new botpress.Integration({
  register: async ({ webhookUrl, ctx, client }) => {
    const graphClient = getClient(ctx.configuration)
    logger.info('suscribing webhook %s', webhookUrl)
    const subscriptionId = await graphClient.subscribeWebhook(webhookUrl, ctx)
    client.setState({
      type: 'integration',
      id: ctx.integrationId,
      name: 'subscriptionInfo',
      payload: {
        subscriptionId,
      },
    })
    logger.info('subscriptionId ', subscriptionId)

    /**
     * This is called when a bot installs the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
  },
  unregister: async ({ ctx, client }) => {
    const graphClient = getClient(ctx.configuration)

    const stateRes = await client.getState({
      id: ctx.integrationId,
      name: 'subscriptionInfo',
      type: 'integration',
    })

    const { state } = stateRes
    const { subscriptionId } = state.payload

    await graphClient.unsubscribeWebhook(subscriptionId)

    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
  },
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async (props) => {
          const graphClient = getClient(props.ctx.configuration)
          await graphClient.sendMail({
            ...props,
            body: {
              contentType: 'text',
              content: `${props.payload.text}\n\n${props.ctx.configuration.emailSignature}`,
            },
          })
        },
        image: async () => {
          throw new NotImplementedError()
        },
        markdown: async () => {
          throw new NotImplementedError()
        },
        audio: async () => {
          throw new NotImplementedError()
        },
        video: async () => {
          throw new NotImplementedError()
        },
        file: async () => {
          throw new NotImplementedError()
        },
        location: async () => {
          throw new NotImplementedError()
        },
        carousel: async () => {
          throw new NotImplementedError()
        },
        card: async () => {
          throw new NotImplementedError()
        },
        choice: async (props) => {
          const graphClient = getClient(props.ctx.configuration)
          let content = `${props.payload.text}\n`

          for (const option of props.payload.options) {
            content += `- ${option.label}\n`
          }
          content += `\n\n${props.ctx.configuration.emailSignature}`
          await graphClient.sendMail({
            ...props,
            body: {
              contentType: 'text',
              content,
            },
          })
        },
        dropdown: async (props) => {
          const graphClient = getClient(props.ctx.configuration)
          let content = `${props.payload.text}\n`

          for (const option of props.payload.options) {
            content += `- ${option.label}\n`
          }
          content += `\n\n${props.ctx.configuration.emailSignature}`
          await graphClient.sendMail({
            ...props,
            body: {
              contentType: 'text',
              content,
            },
          })
        },
        html: async (props) => {
          const graphClient = getClient(props.ctx.configuration)
          await graphClient.sendMail({
            ...props,
            body: {
              contentType: 'html',
              content: props.payload.content,
            },
          })
        },
      },
    },
  },
  handler: async ({ req, ctx, client }) => {
    // If there is a validationToken parameter
    // in the query string, this is the endpoint validation
    // request sent by Microsoft Graph. Return the token
    // as plain text with a 200 response
    // https://docs.microsoft.com/graph/webhooks#notification-endpoint-validation
    if (req.query) {
      const queryString = req.query as string
      const queryParameters = queryString.split('&')
      const queryParams: { [key: string]: string } = {}

      for (const param of queryParameters) {
        const [key, value] = param.split('=')
        if (key && value) {
          queryParams[key] = value
        }
      }

      const validationToken = queryParams.validationToken

      if (validationToken) {
        var str = decodeURIComponent(validationToken).split('+').join(' ')
        return {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
          },
          body: str,
        }
      }
    }

    if (!req.body) {
      logger.warn('Handler received an empty body')
      return
    }

    const body = JSON.parse(req.body)
    if (!body.value) {
      logger.warn('Missing property value in the body')
      return
    }

    body.value.forEach(async (message: any) => {
      const graphClient = getClient(ctx.configuration)
      if (message.lifecycleEvent) {
        logger.info(`Handler received lifecycleEvent `)
        await graphClient.handleLifecycleEvents(message)
      } else if (message.resourceData) {
        const odataId = message.resourceData['@odata.id']
        const notificationContent = await graphClient.getNotificationContent(odataId)

        let emailbody = _.get(notificationContent, 'body.content')
        const sender = _.get(notificationContent, 'sender.emailAddress.address')

        if (notificationContent.body?.contentType === 'html') {
          emailbody = extractMessageFromHtml(emailbody)
        }

        if (!emailbody) {
          logger.warn('invalid email body: ', JSON.stringify(message, null, 3))
          return
        }
        if (!sender) {
          logger.warn('missing sender property: ', JSON.stringify(message, null, 3))
          return
        }

        const { conversation } = await client.getOrCreateConversation({
          channel: 'channel',
          tags: {
            'outlook:id': notificationContent.conversationId,
            'outlook:subject': notificationContent.subject,
            'outlook:from': JSON.stringify(notificationContent.from),
            'outlook:toRecipients': JSON.stringify(notificationContent.toRecipients),
            'outlook:ccRecipients': JSON.stringify(notificationContent.ccRecipients),
            'outlook:refMessageId': notificationContent.id,
          },
        })

        const { user } = await client.getOrCreateUser({
          tags: {
            'outlook:id': sender,
          },
        })

        await client.createMessage({
          tags: { 'outlook:id': notificationContent.id },
          type: 'text',
          userId: user.id,
          conversationId: conversation.id,
          payload: { text: emailbody },
        })
      } else {
        logger.warn('Message not supported: ', JSON.stringify(message, null, 3))
        return
      }
    })

    return
  },
})

function extractMessageFromHtml(htmlContent: string): string {
  // Load the HTML content using cheerio
  const $ = loadHtml(htmlContent)
  $('#Signature').remove() // Remove signature from email
  // Extract the message from the HTML
  const message = $('body').text()

  return message
}

const getClient = (config: Config) => new GraphApi(config.tenantId, config.clientId, config.clientSecret)

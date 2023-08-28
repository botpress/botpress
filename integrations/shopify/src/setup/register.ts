import axios from 'axios'
import { ARR_OF_EVENTS, SHOPIFY_API_VERSION } from '../const'
import type * as botpress from '.botpress'

type IntegrationLogger = Parameters<botpress.IntegrationProps['handler']>[0]['logger']
type Implementation = ConstructorParameters<typeof botpress.Integration>[0]
type RegisterFunction = Implementation['register']
type IntegrationContext = Parameters<RegisterFunction>[0]['ctx']

function getValue(obj: string | undefined) {
  if (typeof obj === 'string') {
    return obj
  } else {
    return ''
  }
}

export const register: RegisterFunction = async ({ ctx, logger, webhookUrl }) => {
  await Promise.all(
    ARR_OF_EVENTS.map(async (event) => {
      const topic = getValue(event)
      await createWebhook({ topic, ctx, logger, webhookUrl })
    })
  )
}

async function createWebhook({
  topic,
  ctx,
  logger,
  webhookUrl,
}: {
  topic: string
  ctx: IntegrationContext
  logger: IntegrationLogger
  webhookUrl: string
}) {
  const topicReadable = topic.replace('/', ' ')

  const axiosConfig = {
    baseURL: `https://${ctx.configuration.shopName}.myshopify.com`,
    headers: {
      'X-Shopify-Access-Token': ctx.configuration.access_token,
      'Content-Type': 'application/json',
    },
  }

  try {
    let response = await axios.get(
      `/admin/api/${SHOPIFY_API_VERSION}/webhooks.json?topic=${topic}&address=${webhookUrl}`,
      axiosConfig
    )

    if (response.data.webhooks.length > 0) {
      logger
        .forBot()
        .info(
          `Shopify "${topicReadable}" Webhook was found with id ${response.data.webhooks[0].id.toString()} for Bot ${
            ctx.botId
          }. Webhook was not created`
        )
      return
    }

    response = await axios.post(
      `/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`,
      {
        webhook: {
          topic,
          address: webhookUrl,
          format: 'json',
        },
      },
      axiosConfig
    )

    logger
      .forBot()
      .info(
        `Shopify ${topicReadable} Webhook Created ${response.data.webhook.id.toString()} for Bot with Id ${ctx.botId}`
      )
    return response.data.webhook.id.toString()
  } catch (e) {
    logger.forBot().error(`'Shopify ${topicReadable} Webhook Creation' exception ${JSON.stringify(e)}`)
    return null
  }
}

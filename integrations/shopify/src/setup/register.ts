import type { IntegrationContext, IntegrationProps } from '@botpress/sdk'
import axios from 'axios'
import { ARR_OF_EVENTS, SHOPIFY_API_VERSION } from '../const'
import type * as botpress from '.botpress'
import type { Configuration } from '.botpress/implementation/configuration'

type IntegrationLogger = Parameters<IntegrationProps['handler']>[0]['logger']
type Implementation = ConstructorParameters<typeof botpress.Integration>[0]
type RegisterFunction = Implementation['register']

function getValue(obj: string | undefined) {
  if (typeof obj === 'string') {
    return obj
  } else {
    return ''
  }
}

export const register: RegisterFunction = async ({ client, ctx, logger, webhookUrl }) => {
  const arrOfWebhookIds = []
  for (let i = 0; i < ARR_OF_EVENTS.length; i++) {
    const topic = getValue(ARR_OF_EVENTS[i])
    const webhookId = await createWebhook(topic, ctx, logger, webhookUrl)
    arrOfWebhookIds.push({ webhookId, topic })
  }

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: `${ctx.integrationId}`,
    payload: { arrOfWebhookIds },
  })
}

async function createWebhook(
  topic: string,
  ctx: IntegrationContext<Configuration>,
  logger: IntegrationLogger,
  webhookUrl: string
) {
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

    response = await axios.post(`/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`, {
      webhook: {
        topic,
        address: webhookUrl,
        format: 'json',
      },
      axiosConfig,
    })

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

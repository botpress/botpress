import axios from 'axios'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import * as bp from '.botpress'
import { StockItemSchema } from '../misc/zod-schemas'

export const getStockItem: bp.IntegrationProps['actions']['getStockItem'] = async ({ ctx, input, logger }) => {
  const { magento_domain, consumer_key, consumer_secret, access_token, access_token_secret, user_agent } =
    ctx.configuration

  const oauth = new OAuth({
    consumer: {
      key: consumer_key,
      secret: consumer_secret,
    },
    signature_method: 'HMAC-SHA256',
    hash_function(baseString: string, key: string) {
      return crypto.createHmac('sha256', key).update(baseString).digest('base64')
    },
  })

  const token = {
    key: access_token,
    secret: access_token_secret,
  }

  const url = `https://${magento_domain}/rest/default/V1/stockItems/${encodeURIComponent(input.sku)}`

  const requestData = {
    url,
    method: 'GET',
  }

  const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

  const config = {
    method: requestData.method,
    url: requestData.url,
    maxBodyLength: Infinity,
    headers: {
      ...authHeader,
      'User-Agent': user_agent,
    },
  }

  logger.forBot().info(`Magento stock item URL: ${config.url}`)

  try {
    const response = await axios(config)
    try {
      const stockData = StockItemSchema.parse(response.data)
      return {
        qty: stockData.qty,
        is_in_stock: stockData.is_in_stock,
      }
    } catch (err) {
      return { error: 'Invalid stock item response', details: err instanceof Error ? err.message : err }
    }
  } catch (error) {
    console.error(error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
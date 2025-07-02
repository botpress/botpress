// import * as sdk from '@botpress/sdk'
import { getProducts, getStockItem, syncProducts } from './actions'
import * as bp from '.botpress'
import axios from 'axios'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    logger.forBot().info('Registering Magento2 integration')
    
    // Basic configuration validation
    try {
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

      // Token credentials
      const token = {
        key: access_token,
        secret: access_token_secret,
      }

      // Test URL - using the currency endpoint for basic validation
      const testUrl = `https://${magento_domain}/rest/all/V1/directory/currency`

      // Request details
      const requestData = {
        url: testUrl,
        method: 'GET',
      }

      // Generate OAuth Authorization header
      const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

      // Axios request configuration
      const config = {
        method: requestData.method,
        url: requestData.url,
        maxBodyLength: Infinity,
        headers: {
          ...authHeader,
          'User-Agent': user_agent || 'Botpress-Magento2-Integration',
          'accept': 'application/json',
        },
      }

      // Send test request
      const response = await axios(config)
      
      if (response.status === 200) {
        logger.forBot().info('Magento2 configuration validation successful')
        logger.forBot().debug('Currency endpoint response:', response.data)
      } else {
        throw new Error(`Unexpected response status: ${response.status}`)
      }
    } catch (error) {
      logger.forBot().error('Magento2 configuration validation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Failed to validate Magento2 configuration: ${errorMessage}`)
    }
  },
  unregister: async ({ logger }) => {
    logger.forBot().info('Unregistering Magento2 integration')
  },
  actions: {
    getProducts,
    getStockItem,
    syncProducts,
  },
  channels: {},
  handler: async () => {},
})

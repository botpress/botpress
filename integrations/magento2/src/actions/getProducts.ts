import axios from 'axios'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import * as bp from '.botpress'

export const getProducts: bp.IntegrationProps['actions']['getProducts'] = async ({ ctx, input }) => {
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

  const searchCriteria = input.searchCriteria || 'searchCriteria='
  const url = `https://${magento_domain}/rest/default/V1/products?${searchCriteria}`

  // Request details
  const requestData = {
    url,
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
      'User-Agent': user_agent,
    },
  }

  // Send request
  try {
    const response = await axios(config)
    return { result: response.data }
  } catch (error) {
    console.error(error)
  }

  return { result: {} }
}

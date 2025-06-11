import axios from 'axios'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import * as bp from '.botpress'

export const getProducts: bp.IntegrationProps['actions']['getProducts'] = async () => {
  const oauth = new OAuth({
    consumer: {
      key: '9xuv1xyuh6tbyi0kpgh7a0ydl5ax8ao4',
      secret: 'zu82u2wnfftnagu36buegfs11i7mo01f',
    },
    signature_method: 'HMAC-SHA256',
    hash_function(baseString: string, key: string) {
      return crypto.createHmac('sha256', key).update(baseString).digest('base64')
    },
  })

  // Token credentials
  const token = {
    key: '5a7rigrru5f12knlkvuhoaqt8ablmx09',
    secret: 'lb9mm2jzr6ddoiw3371pougx1sw9vkja',
  }

  // Request details
  const requestData = {
    url: 'https://www.acc-obelink.be/rest/defaultrest/default/V1/products?searchCriteria=',
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
      'User-Agent': 'Botpress',
    },
  }

  // Send request
  try {
    const response = await axios(config)
    console.log(JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.error(error)
  }

  return { products: [] }
}

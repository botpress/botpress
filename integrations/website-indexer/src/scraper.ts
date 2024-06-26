import { z } from '@botpress/sdk'
import axios, { AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'
import { v5 } from 'uuid'
import { getErrorMessage } from './errors'
import { urlSchema } from './urlSchema'
import * as bp from '.botpress'

type IntegrationLogger = bp.Logger

const fetchPageHtmlSchema = z.object({
  url: urlSchema,
})

export class Scraper {
  private client: AxiosInstance
  constructor(logger: IntegrationLogger, apiKey: string) {
    this.client = axios.create({
      baseURL: 'http://api.scraperapi.com',
      params: {
        api_key: apiKey,
      },
    })

    axiosRetry(this.client, {
      retries: 2,
      retryDelay: (retry) => (retry + 1) * 1000,
      retryCondition: (error) => {
        const codes = [400, 429, 500, 502, 503, 504]
        return codes.includes(error.response?.status ?? 0)
      },
      onRetry: (retryCount, error) => {
        logger.forBot().warn(`Retrying request ${retryCount}`, getErrorMessage(error))
      },
    })
  }

  public async fetchPageHtml(url: string) {
    return await _fetchPageHtml(this.client, {
      url,
    })
  }
}

const _fetchPageHtml = async (client: AxiosInstance, options: z.infer<typeof fetchPageHtmlSchema>) => {
  const UUID_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341' // can be any random UUID, as long as it's the same for all requests

  options = fetchPageHtmlSchema.parse(options)

  // response is returned as an arraybuffer so the studio receives the original file & content type (ex: docx, pdf)
  const response = await client.get('/', {
    responseType: 'arraybuffer',
    params: {
      url: urlSchema.parse(options.url),
      // ultra_premium: ULTRA_PREMIUM_SCRAPER_ALLOWED_DOMAINS.some((x) => options.url.startsWith(x)),
      ultra_premium: false,
    },
  })

  return {
    content: response.data as Buffer,
    contentType: response.headers['content-type'] as string,
    id: v5(options.url.trim().toLowerCase(), UUID_NAMESPACE),
    cost: parseInt(response.headers['sa-credit-cost']),
  }
}

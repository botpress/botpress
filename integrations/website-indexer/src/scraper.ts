import { ZodError, z } from '@botpress/sdk'
import axios, { AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'
import _ from 'lodash'
import { v5 } from 'uuid'
import * as bp from '.botpress'

type IntegrationLogger = bp.Logger

const joinPath = (path: (string | number)[]): string => {
  if (path.length === 1) {
    return path[0]!.toString()
  }

  return path.reduce<string>((acc, item) => {
    if (typeof item === 'number') {
      return `${acc}[${item}]`
    }

    return `${acc}${acc.length === 0 ? '' : '.'}${item}`
  }, '')
}

const printZodErrors = (errors: z.ZodIssue[]) =>
  `Validation Error: ${errors
    .map((x) => `${x.path.length > 0 ? `'${joinPath(x.path)}': ` : ''} ${x.message}`)
    .join('\n')}`

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    const statusCode = err.response?.status

    if (!data) {
      return `${err.message} (Status Code: ${statusCode})`
    }

    if (_.isArray(data.errors)) {
      return `${printZodErrors(data.errors)} (Status Code: ${statusCode})`
    }

    return `${data.message || data.error?.message || data.error || err.message} (Status Code: ${statusCode})`
  } else if (err instanceof ZodError) {
    return printZodErrors(err.errors)
  } else if (err instanceof Error) {
    return err.message || 'Unexpected error'
  } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  } else if (typeof err === 'string') {
    return err
  }

  return 'Unexpected error'
}

export const urlSchema = z.string().transform((url, ctx) => {
  url = url.trim()
  if (!url.includes('://')) {
    url = `https://${url}`
  }
  try {
    const x = new URL(url)
    if (x.protocol !== 'http:' && x.protocol !== 'https:') {
      ctx.addIssue({
        // code: z.ZodIssueCode.custom,
        code: 'custom',
        message: 'Invalid protocol, only URLs starting with HTTP and HTTPS are supported',
      })
      return z.NEVER
    }

    if (!/.\.[a-zA-Z]{2,}$/.test(x.hostname)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid TLD',
      })
      return z.NEVER
    }
    const pathName = x.pathname.endsWith('/') ? x.pathname.slice(0, -1) : x.pathname
    return `${x.origin}${pathName}`.toLowerCase()
  } catch (e) {
    ctx.addIssue({
      code: 'custom',
      message: 'Invalid URL: ' + getErrorMessage(e),
    })
    return z.NEVER
  }
})

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
  }
}

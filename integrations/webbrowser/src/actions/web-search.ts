import axios, { isAxiosError } from 'axios'
import * as bp from '.botpress'

type BingSearchResult = {
  name: string
  url: string
  snippet: string
  links?: {
    name: string
    url: string
  }[]
}

export const webSearch: bp.IntegrationProps['actions']['webSearch'] = async ({ client, input, logger }) => {
  logger.forBot().debug('Search Web', { input })

  const clientConfig = (client as any).client.config

  const axiosConfig = {
    ...clientConfig,
    baseURL: `${clientConfig.apiUrl}/v1/cognitive`,
  }

  try {
    const result = await axios.post<BingSearchResult[]>('bing/search', input, axiosConfig)

    return { results: result.data }
  } catch (err) {
    if (isAxiosError(err)) {
      logger.forBot().error('Error during web search', { error: err.response?.data })
    }
    throw err
  }
}

import axios, { isAxiosError } from 'axios'
import { browsePages } from './browse-pages'
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

export const webSearch: bp.IntegrationProps['actions']['webSearch'] = async ({ client, input, logger, type, ctx }) => {
  logger.forBot().debug('Search Web', { input })

  const clientConfig = (client as any).client.config

  const axiosConfig = {
    ...clientConfig,
    baseURL: `${clientConfig.apiUrl}/v1/cognitive`,
  }

  try {
    const { data: searchResults } = await axios.post<BingSearchResult[]>('bing/search', input, axiosConfig)

    if (!input.browsePages) {
      return { results: searchResults }
    }

    const pageContent = await browsePages({
      input: { urls: searchResults.map((x) => x.url) },
      logger,
      client,
      type: 'browsePages',
      ctx,
    })

    return {
      results: searchResults.map((searchResult) => ({
        ...searchResult,
        page: pageContent.results?.find((page) => page.url === searchResult.url),
      })),
    }
  } catch (err) {
    if (isAxiosError(err)) {
      logger.forBot().error('Error during web search', { error: err.response?.data })
    }
    throw err
  }
}

import axios from 'axios'
import * as bp from '.botpress'

type FireCrawlResponse = {
  success: boolean
  data: {
    content: string
    metadata: {
      ogLocaleAlternate: string[]
      sourceURL: string
      pageStatusCode: number
    }
  }
  returnCode: number
}

const COST_PER_PAGE = 0.0015

const getPageContent = async (url: string, logger: any): Promise<{ content: string; url: string }> => {
  const startTime = Date.now()
  const { data } = await axios.post<FireCrawlResponse>(
    'https://api.firecrawl.dev/v0/scrape',
    {
      url,
      pageOptions: {
        onlyMainContent: true,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${bp.secrets.FIRECRAWL_API_KEY}`,
      },
    }
  )

  logger.forBot().info(`Browsing ${url} took ${Date.now() - startTime}ms`)

  return { content: data.data.content, url }
}

export const browsePages: bp.IntegrationProps['actions']['browsePages'] = async ({ input, logger, metadata }) => {
  const startTime = Date.now()

  try {
    const pageContentPromises = await Promise.allSettled(input.urls.map((url) => getPageContent(url, logger)))

    const results = pageContentPromises
      .filter((promise): promise is PromiseFulfilledResult<any> => promise.status === 'fulfilled')
      .map((result) => result.value)

    const cost = input.urls.length * COST_PER_PAGE
    metadata.setCost(cost)

    return {
      results,
      botpress: { cost },
    }
  } catch (err) {
    logger.forBot().error('There was an error while browsing the page.', err)
    throw err
  } finally {
    logger.forBot().info(`Browsing took ${Date.now() - startTime}ms`)
  }
}

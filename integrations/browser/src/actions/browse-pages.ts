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

const getPageContent = async (props: {
  url: string
  logger: any
  waitFor?: number
}): Promise<{ content: string; url: string }> => {
  const startTime = Date.now()
  const { data } = await axios.post<FireCrawlResponse>(
    'https://api.firecrawl.dev/v0/scrape',
    {
      url: props.url,
      pageOptions: {
        onlyMainContent: true,
        waitFor: props.waitFor,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${bp.secrets.FIRECRAWL_API_KEY}`,
      },
    }
  )

  props.logger.forBot().info(`Browsing ${props.url} took ${Date.now() - startTime}ms`)

  return { content: data.data.content, url: props.url }
}

export const browsePages: bp.IntegrationProps['actions']['browsePages'] = async ({ input, logger, metadata }) => {
  const startTime = Date.now()

  try {
    const pageContentPromises = await Promise.allSettled(
      input.urls.map((url) => getPageContent({ url, logger, waitFor: input.waitFor }))
    )

    const results = pageContentPromises
      .filter((promise): promise is PromiseFulfilledResult<any> => promise.status === 'fulfilled')
      .map((result) => result.value)

    // only charging for successful pages
    const cost = results.length * COST_PER_PAGE
    metadata.setCost(cost)

    return {
      results,
    }
  } catch (err) {
    logger.forBot().error('There was an error while browsing the page.', err)
    throw err
  } finally {
    logger.forBot().info(`Browsing took ${Date.now() - startTime}ms`)
  }
}

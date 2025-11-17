import { IntegrationLogger, RuntimeError } from '@botpress/sdk'
import Firecrawl from '@mendable/firecrawl-js'
import { FullPage } from 'src/definitions/actions'
import * as bp from '.botpress'

const COST_PER_PAGE = 0.0015

const fixOutput = (val: unknown): string => {
  if (typeof val === 'string') {
    return val
  } else if (Array.isArray(val)) {
    return val.join(' ')
  }
  return ''
}

const getPageContent = async (props: {
  url: string
  logger: IntegrationLogger
  waitFor?: number
  timeout?: number
  maxAge?: number
}): Promise<FullPage> => {
  const firecrawl = new Firecrawl({ apiKey: bp.secrets.FIRECRAWL_API_KEY })

  const startTime = Date.now()

  try {
    const result = await firecrawl.scrape(props.url, {
      onlyMainContent: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      removeBase64Images: true,
      waitFor: props.waitFor,
      timeout: props.timeout,
      formats: ['markdown', 'rawHtml'],
      storeInCache: true,
    })

    props.logger.forBot().debug(`Firecrawl API call took ${Date.now() - startTime}ms for url: ${props.url}`)

    return {
      url: props.url,
      content: result.markdown!,
      raw: result.rawHtml!,
      favicon: fixOutput(result.metadata?.favicon),
      title: fixOutput(result.metadata?.title),
      description: fixOutput(result.metadata?.description),
    }
  } catch (err) {
    props.logger.error('There was an error while calling Firecrawl API.', err)
    throw new RuntimeError(`There was an error while browsing the page: ${props.url}`)
  }
}

export const browsePages: bp.IntegrationProps['actions']['browsePages'] = async ({ input, logger, metadata }) => {
  const startTime = Date.now()

  try {
    const pageContentPromises = await Promise.allSettled(
      input.urls.map((url) => getPageContent({ url, logger, waitFor: input.waitFor, timeout: input.timeout }))
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
    logger.forBot().info(`Browsing ${input.urls.length} urls took ${Date.now() - startTime}ms`)
  }
}

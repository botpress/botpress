import axios from 'axios'
import { backOff } from 'exponential-backoff'
import { getErrorMessage } from './errors'
import { Scraper } from './scraper'
import { fetchUrls } from './urlFetcher'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    indexUrls: async ({ input, logger, client }) => {
      const { pageUrls } = input

      logger.forBot().debug(`Indexing ${pageUrls.length} urls`)

      const scraper = new Scraper(bp.secrets.SCRAPER_API_KEY)
      scraper.onRetry(({ retryCount, error }) => {
        logger.forBot().warn(`Retrying request ${retryCount}`, getErrorMessage(error))
      })
      const results = await Promise.allSettled(
        pageUrls.map(async (url) => {
          const scrapingResponse = await backOff(
            async () => {
              return await scraper.fetchPageHtml(url)
            },
            {
              retry: (e) => {
                logger.forBot().debug('retrying scraping ...')
                return e?.response?.status === 429
              },
              numOfAttempts: 10,
              maxDelay: 1000,
              delayFirstAttempt: false,
              jitter: 'full',
            }
          )

          logger.forBot().debug(`Scraped ${url} with ${scrapingResponse.cost} credits`)

          const response = await client.upsertFile({
            key: url,
            size: scrapingResponse.content.byteLength,
            index: true,
            contentType: 'text/html',
          })

          logger.forBot().debug(`uploading file: ${url}`)
          await axios.put(response.file.uploadUrl, scrapingResponse.content)
          return { fileId: response.file.id, url, scraperCreditCost: scrapingResponse.cost }
        })
      )

      const outputResults: (
        | {
            status: 'success'
            url: string
            fileId: string
            scraperCreditCost: number
          }
        | {
            status: 'failed'
            url: string
            failureReason: string
          }
      )[] = []

      for (const r of results) {
        if (r.status === 'rejected') {
          outputResults.push({ status: 'failed', url: r.reason.url, failureReason: r.reason.message })
        } else {
          outputResults.push({
            status: 'success',
            url: r.value.url,
            fileId: r.value.fileId,
            scraperCreditCost: r.value.scraperCreditCost,
          })
        }
      }

      return { results: outputResults }
    },
    fetchUrls: async ({ input: { rootUrl } }) => {
      const urls = await fetchUrls(rootUrl)
      return { urls }
    },
  },
  channels: {},
  handler: async () => {},
})

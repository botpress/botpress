import * as sdk from '@botpress/sdk'
import axios from 'axios'
import { Scraper } from './scraper'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {
    /**
     * This is called when a bot installs the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  actions: {
    indexPage: async ({ input: { pageUrl }, logger, client }) => {
      logger.forBot().debug(`Indexing page ${pageUrl}`)

      const scraper = new Scraper(logger, bp.secrets.SCRAPER_API_KEY)
      const scrapingResponse = await scraper.fetchPageHtml(pageUrl)
      const response = await client.upsertFile({
        key: pageUrl,
        size: scrapingResponse.content.byteLength,
        index: true,
        contentType: 'text/html',
      })
      logger.forBot().debug(`Page ${pageUrl} indexed`)
      logger.forBot().debug(`Response: ${JSON.stringify(response)}`)

      await axios.put(response.file.uploadUrl, scrapingResponse.content)
      logger.forBot().debug(`Page ${pageUrl} uploaded`)

      return {}
    },
    testCron: async ({ logger }) => {
      logger.forBot().debug('Test cron job')
      return {}
    },
  },
  channels: {},
  handler: async () => {},
})

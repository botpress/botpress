import * as bp from '.botpress'
import { getClient } from '../client'
import { buildCrawlerInput } from '../helpers/data-transformer'
import { persistRunMapping } from '../helpers/runMapping'
import { RuntimeError } from '@botpress/sdk'

export const startCrawlerRun = async (props: bp.ActionProps['startCrawlerRun']) => {
  const { input, logger, ctx, client } = props
  logger.forBot().info(`Starting crawler run`)

  try {
    const { kbId, ...apifyParams } = input

    if (!kbId || kbId === '') {
      throw new RuntimeError('kbId is required to start a crawler run. Please provide a valid Knowledge Base ID.')
    }

    const crawlerInput = buildCrawlerInput(apifyParams)

    if (apifyParams.headers) {
      crawlerInput.headers = apifyParams.headers
    }

    const apifyClient = getClient(ctx.configuration.apiToken, client, logger, ctx.integrationId, ctx)
    const result = await apifyClient.startCrawlerRun(crawlerInput)

    logger.forBot().info(`Crawler run started successfully. Run ID: ${result.runId}`)

    const runId = result.runId

    await persistRunMapping(client, ctx.integrationId, runId, input.kbId, logger)

    logger.forBot().debug(`Persisted kbId mapping for run ${runId}`)

    return {
      success: true,
      message: `Crawler run started successfully.`,
      data: result,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logger.forBot().error(`Start crawler run exception: ${errorMessage}`)
    throw new RuntimeError(`Apify API Error: ${errorMessage}`)
  }
}

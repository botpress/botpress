import { RuntimeError } from '@botpress/sdk'
import { getClient } from '../client'
import { persistRunMapping } from '../helpers/runMapping'
import * as bp from '.botpress'

export const syncRunResults = async (props: bp.ActionProps['syncRunResults']) => {
  const { input, logger, ctx, client } = props
  const { runId, kbId } = input

  if (!runId || runId === '') {
    const errorMessage = 'Run ID is required'
    logger.forBot().error(errorMessage)
    throw new RuntimeError(errorMessage)
  }

  if (!kbId || kbId === '') {
    const errorMessage = 'Knowledge Base ID (kbId) is required'
    logger.forBot().error(errorMessage)
    throw new RuntimeError(errorMessage)
  }

  try {
    const apifyClient = getClient(ctx.configuration.apiToken, client, logger, ctx.integrationId, ctx)

    // verify the run exists and is also completed
    const runDetails = await apifyClient.getRun(runId)

    if (runDetails.status === 'UNKNOWN' && runDetails.runId === runId) {
      const errorMessage = `Run with ID ${runId} not found`
      logger.forBot().error(errorMessage)
      throw new RuntimeError(errorMessage)
    }

    if (runDetails.status !== 'SUCCEEDED') {
      logger.forBot().error(`Run is not completed. Current status: ${runDetails.status}`)
      throw new RuntimeError(`Run is not completed. Current status: ${runDetails.status}`)
    }

    if (!runDetails.datasetId) {
      logger.forBot().error('No dataset ID found for completed run')
      throw new RuntimeError('No dataset ID found for completed run')
    }

    // store run mapping so the webhook handler can find it
    await persistRunMapping(client, ctx.integrationId, runId, kbId, logger)

    logger.forBot().info(`Starting sync: ${runId} → KB ${kbId}`)
    await apifyClient.triggerSyncWebhook(runId, kbId, 0)

    return {
      success: true,
      message: `Run results sync initiated successfully. The webhook handler will process all data with continuations.`,
      data: {
        runId: runDetails.runId,
        datasetId: runDetails.datasetId,
        kbId: kbId,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logger.forBot().error(`Sync run results exception: ${errorMessage}`)
    throw new RuntimeError(`Apify API Error: ${errorMessage}`)
  }
}

import { getClient } from '../client'
import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'

export const getRunStatus = async (props: bp.ActionProps['getRunStatus']) => {
  const { input, logger, ctx, client } = props
  const { runId } = input

  logger.forBot().info(`Checking status for run ID: ${runId}`)

  try {
    const apifyClient = getClient(ctx.configuration.apiToken, client, logger, ctx.integrationId, ctx)

    const result = await apifyClient.getRun(runId)

    if (result.status === 'UNKNOWN' && result.runId === runId) {
      const errorMessage = `Run with ID ${runId} not found`
      logger.forBot().error(errorMessage)
      throw new RuntimeError(errorMessage)
    }

    return {
      success: true,
      message: `Run status retrieved successfully.`,
      data: result,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logger.forBot().error(`Get run status exception: ${errorMessage}`)
    throw new RuntimeError(`Failed to get run status: ${errorMessage}`)
  }
}

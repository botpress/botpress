import { getClient } from '../client'
import { searchRecordsInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const searchRecords: IntegrationProps['actions']['searchRecords'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = searchRecordsInputSchema.parse(input)

  const zohoClient = getClient(
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  )

  logger.forBot().info(`Validated Input - ${JSON.stringify(validatedInput)}`)

  try {
    const result = await zohoClient.searchRecords(validatedInput.module, validatedInput.criteria)

    logger.forBot().info('Successful - Search Records')
    logger.forBot().debug(`Result Data - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Search Records' exception: ${errorMessage}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}

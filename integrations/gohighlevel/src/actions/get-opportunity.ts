import { getClient } from '../client'
import { getOpportunityInputSchema, getOpportunityOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const getOpportunity: Implementation['actions']['getOpportunity'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = getOpportunityInputSchema.parse(input)

  const ghlClient = getClient(
    ctx.configuration.accessToken,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx,
    client
  )

  logger.forBot().debug(`Validated Input - ${JSON.stringify(validatedInput)}`)

  try {
    const result = await ghlClient.getOpportunity(validatedInput.opportunityId)

    logger.forBot().info(`Successful - Get Opportunity - ${JSON.stringify(validatedInput)}`)
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Get Opportunity' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}

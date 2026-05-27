import { getClient } from '../client'
import { deleteOpportunityInputSchema, deleteOpportunityOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const deleteOpportunity: Implementation['actions']['deleteOpportunity'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = deleteOpportunityInputSchema.parse(input)

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
    const result = await ghlClient.deleteOpportunity(validatedInput.opportunityId)

    logger.forBot().info(`Successful - Delete Opportunity - ${JSON.stringify(validatedInput)}`)
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Delete Opportunity' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}

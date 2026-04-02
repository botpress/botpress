import { getClient } from '../client'
import { createOpportunityInputSchema, createOpportunityOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const createOpportunity: Implementation['actions']['createOpportunity'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = createOpportunityInputSchema.parse(input)

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
    const result = await ghlClient.createOpportunity(validatedInput.properties)

    logger.forBot().info(`Successful - Create Opportunity - ${JSON.stringify(validatedInput)}`)
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Create Opportunity' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}

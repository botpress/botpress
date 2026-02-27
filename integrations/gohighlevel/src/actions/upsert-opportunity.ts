import { getClient } from '../client'
import { upsertOpportunityInputSchema, upsertOpportunityOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const upsertOpportunity: Implementation['actions']['upsertOpportunity'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = upsertOpportunityInputSchema.parse(input)

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
    const result = await ghlClient.upsertOpportunity(validatedInput.properties)

    logger.forBot().info(`Successful - Upsert Opportunity - ${JSON.stringify(validatedInput)}`)
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Upsert Opportunity' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}

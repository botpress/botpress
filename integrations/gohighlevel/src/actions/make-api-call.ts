import { getClient } from '../client'
import { makeApiCallInputSchema, makeApiCallOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const makeApiCall: Implementation['actions']['makeApiCall'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = makeApiCallInputSchema.parse(input)
  const ghlClient = getClient(
    ctx.configuration.accessToken,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx,
    client
  )

  try {
    const result = await ghlClient.makeApiCall(
      validatedInput.endpoint,
      validatedInput.method,
      validatedInput.data,
      validatedInput.params
    )

    logger.forBot().info(`Successful - Make API Call - ${JSON.stringify(validatedInput)}`)
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Make API Call' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}

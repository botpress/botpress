import { getClient } from '../client'
import { getOrderByIdInputSchema, getOrderByIdOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const getOrderById: Implementation['actions']['getOrderById'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = getOrderByIdInputSchema.parse(input)

  const ghlClient = getClient(
    ctx.configuration.accessToken,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx,
    client
  )

  logger.forBot().debug(`Validated Input - ${JSON.stringify(validatedInput)}`)

  const params = {
    altId: validatedInput.altId,
    altType: validatedInput.altType,
  }

  try {
    const result = await ghlClient.getOrderById(validatedInput.orderId, JSON.stringify(params))

    logger.forBot().info(`Successful - Get Order By Id - ${JSON.stringify(validatedInput)}`)
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Get Order By Id' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}

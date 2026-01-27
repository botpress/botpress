import { getClient } from '../client'
import { listOrdersInputSchema, listOrdersOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const listOrders: Implementation['actions']['listOrders'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = listOrdersInputSchema.parse(input)

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
    const result = await ghlClient.listOrders(validatedInput.properties)

    logger.forBot().info(`Successful - List Orders - ${JSON.stringify(validatedInput)}`)
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'List Orders' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}
